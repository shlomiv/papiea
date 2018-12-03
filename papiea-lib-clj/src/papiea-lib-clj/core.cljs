(ns papiea-lib-clj.core
  (:require [cljs.nodejs :as nodejs]
            [instaparse.core :as insta]))

(nodejs/enable-util-print!)

(def sfs-parser-ambigous
  (insta/parser
   "S = complex
    complex = (simple | vector | group)+
    group  = <'.'>? <'['> complex (<','> complex)*  <']'>
    simple = <'.'>? path
    <path> = field (<'.'> field)*
    vector = <'.'>? (add | del | change) <'{'> path <'}'>
    add = <'+'>
    del = <'-'>
    change = epsilon
    <field> = #'[a-zA-Z_0-9]+'    
    "))

(insta/parses sfs-parser-ambigous "a.v.[+{a}.a,d]")

(def sfs-parser
  (insta/parser
   "S                = simple-complex     

    (* optimize simple case *)
    <simple-complex> = complex | simple 
    <non-simple>     = vector  | group    

    (* this trick avoids ambiguity *)
    complex          = (simple <'.'>)? c (<'.'> simple)? 

    (* Allows for arbitraty simple/non-simple combination without introducing ambiguity *)
    <c>              = non-simple (<'.'> non-simple)* | (non-simple <'.'>)+ simple (<'.'> c) 

    (* regular flow *)
    group            = <'['> simple-complex (<','> (<' '>)* simple-complex)*  <']'>
    simple           = path 
    <path>           = field (<'.'> field)*
    vector           = (add | del | change) <'{'> path <'}'>
    add              = <'+'>
    del              = <'-'>
    change           = epsilon
    <field>          = #'[a-zA-Z_0-9]+'    
    "))

(= (insta/parses sfs-parser "a.1.2.{b.1.2}.c.1.2.[d.1.2].e.1.2.{d.1.2}" )
   [[:S
     [:complex
      [:simple "a" "1" "2"]
      [:vector [:change] "b" "1" "2"]
      [:simple "c" "1" "2"]
      [:group [:simple "d" "1" "2"]]
      [:simple "e" "1" "2"]
      [:vector [:change] "d" "1" "2"]]]])

(insta/parses sfs-parser "a.{b}.c.[d].e.{f}.g" :partial true)

(defn optimize-ast
  "Optimizer for now simply removes a `complex` node when it consists of
  only a single operation. This was to obfuscated to describe in the parser"
  [ast]
  (insta/transform {:S (fn [a] a)
                    :complex (fn[& a] (if (= 1 (count a))
                                        (first a)
                                        (into [:papiea/complex] a)))
                    :simple (fn[& a] (into [:papiea/simple] a))
                    :vector (fn[& a] (into [:papiea/vector] a))
                    :group (fn[& a] (into [:papiea/group] a))} ast))
(time(optimize-ast(insta/parse sfs-parser "a.{s}.[a,v]")))
(time(optimize-ast(insta/parse sfs-parser "a.-{s.c}.[+{d},f.{d}.f.d]")))


(defn ^:export foo[a b]
  (println "WITH BAR NO!!!" a b)
  (str a "." b))

(defn -main [& args]
  (println "Hello world"))

(set! *main-cli-fn* -main)

(defn prepare
  "Prepare a spec/status pair to be diffed by the compiled Differ"
  [spec status]
  [{:keys {} :key :papiea/item :spec-val [spec] :status-val [status]}])

(defn flat-choices
  "Used to flatten embedded multiple choices"
  [x]
  (if (and (vector? x) (= 1 (count x)) (vector? (first x))) (first x) x))

(defn ensure-vec
  "ensure the item is a vector. If not, turns to vector. Nil is empty vector"
  [x]
  (cond
    (nil? x)    []
    (vector? x) x
    :else       [x]))

(defn ensure_vector_action [action {:keys [spec-val status-val]}]
  (condp = action
    [:add] (and (empty? status-val) (seq spec-val))
    [:del] (and (empty? spec-val) (seq status-val))
    [:change] (and (seq spec-val) (seq status-val))
    [:all] true
    (throw (js/Error. "Error, dont know what to ensure on vector")))
  )

(defn get-in' [m ks]
  (or (get-in m ks)
      (get-in m (mapv keyword ks))))

(get-in' {:f {:v 3}} ["f" "v"])

(defmulti sfs-compiler (fn[x] (first x)))

(defmethod sfs-compiler :S [[_ q]]
  (let [c (sfs-compiler q)]
    (fn[results]
      (let [r (c results)]
        (when (every? (fn[{:keys [spec-val status-val]}]
                        (not= spec-val status-val))
                      results)
          results)))))

(defmethod sfs-compiler :papiea/simple [[_ & ks]]
  (fn[results]
    (mapv (fn[{:keys [keys key spec-val status-val]}]
            (let [s1 (mapv #(get-in' % ks) spec-val)
                  s2 (mapv #(get-in' % ks) status-val)
                  empty (or (empty? s1) (empty? s2))]
              {:keys keys
               :key (if empty key (last ks))
               :spec-val  (if empty spec-val (flat-choices s1))
               :status-val (if empty status-val (flat-choices s2))}))
          results)))



(defmethod sfs-compiler :papiea/vector [[_ action & ks]]
  (fn[results]
    (into []
          (mapcat (fn[{:keys [keys key spec-val status-val]}]
                    (let [g (group-by #(get-in' % ks)
                                      (into
                                       (mapv #(assoc % :papiea/spec true) spec-val)
                                       (mapv #(assoc % :papiea/status true) status-val)))]
                      (->> (mapv (fn[[id-val [s1 s2]]]              
                                   {:keys (assoc keys (last ks) id-val)
                                    :key key
                                    :spec-val (ensure-vec(cond (:papiea/spec s1) (dissoc s1 :papiea/spec)
                                                               (:papiea/spec s2) (dissoc s2 :papiea/spec)
                                                               :else nil))
                                    :status-val (ensure-vec(cond (:papiea/status s1) (dissoc s1 :papiea/status)
                                                                 (:papiea/status s2) (dissoc s2 :papiea/status)
                                                                 :else nil))})
                                 g)
                           (filterv (partial ensure_vector_action action)))))
                  results))))



(defmethod sfs-compiler :papiea/complex [[_ & cmds]]
  (let [cs (mapv sfs-compiler cmds)]
    (fn[results]
      (reduce (fn[o f] (f o)) results cs))))

(defmethod sfs-compiler :papiea/group [[_ & cmds]]
  (let [cs (mapv sfs-compiler cmds)]
    (fn[results]
      (reduce (fn[o f] (into o (f results))) [] cs)))
  )

(=((sfs-compiler [:papiea/group [:papiea/simple :name] [:papiea/simple :age]])
   (prepare
    {:name "a"
     :age 23}
    {:name "b"
     :age 12})
   )

  [{:keys {} :key :name :spec-val ["a"] :status-val ["b"]}
   {:keys {} :key :age :spec-val [23] :status-val [12]}])

((sfs-compiler[:papiea/simple :name])
 [{:keys {} :key :papiea/item
   :spec-val [{:name "old"}]
   :status-val [{:name "new"}]}])

((sfs-compiler[:papiea/simple :v])
 [{:keys {} :key :papiea/item
   :spec-val [{:v [{:name "old"}
                   {:name "a"}]}]
   :status-val [{:v [{:name "new"}
                     {:name "n"}]}]}])


(=((sfs-compiler[:papiea/vector [:all] :id])
   [{:keys       {} :key :papiea/item
     :spec-val   [{:id 1 :name "old1"} {:id 2 :name "old2"}]
     :status-val [{:id 2 :name "new2"} {:id 1 :name "new1"} {:id 3 :name "old3"}]}])

  [{:keys {:id 1} :key :papiea/item :spec-val [{:id 1 :name "old1"}] :status-val [{:id 1 :name "new1"}]}
   {:keys {:id 2} :key :papiea/item :spec-val [{:id 2 :name "old2"}] :status-val [{:id 2 :name "new2"}]}
   {:keys {:id 3} :key :papiea/item :spec-val [] :status-val [{:id 3 :name "old3"}]}])

(=((sfs-compiler [:papiea/simple :name])
   [{:keys {:id 1} :key :papiea/item :spec-val [{:id 1 :name "old1"}] :status-val [{:id 1 :name "new1"}]}
    {:keys {:id 2} :key :papiea/item :spec-val [{:id 2 :name "old2"}] :status-val [{:id 2 :name "new2"}]}
    {:keys {:id 3} :key :papiea/item :spec-val [] :status-val [{:id 3 :name "old3"}]}])

  [{:keys {:id 1}, :key :name, :spec-val ["old1"], :status-val ["new1"]}
   {:keys {:id 2}, :key :name, :spec-val ["old2"], :status-val ["new2"]}
   {:keys {:id 3}, :key :papiea/item, :spec-val [], :status-val [{:id 3, :name "old3"}]}])


(= ((sfs-compiler [:papiea/complex [:papiea/simple :f1] [:papiea/vector [:all] :id] [:papiea/simple :props] [:papiea/vector [:all] :id2] [:papiea/simple :name]])
    (prepare
     {:f1 [{:id 2 :props [{:id2 4 :name "n1"}]}
           {:id 1 :props [{:id2 5 :name "n2"}]}]}
     {:f1 [{:id 1 :props [{:id2 5 :name "o2"}]}
           {:id 2 :props [{:id2 4 :name "o1"}]}]}))
   
   [{:keys {:id 2, :id2 4}, :key :name, :spec-val ["n1"], :status-val ["o1"]}
    {:keys {:id 1, :id2 5}, :key :name, :spec-val ["n2"], :status-val ["o2"]}])


(= ((sfs-compiler [:papiea/complex
                   [:papiea/simple :f1]
                   [:papiea/vector [:all] :id]
                   [:papiea/group
                    [:papiea/simple :another]
                    [:papiea/complex
                     [:papiea/simple :props]
                     [:papiea/vector [:all] :id2]
                     [:papiea/simple :name]]]])
    (prepare
     {:f1 [{:id 2 :another "a2" :props [{:id2 4 :name "n1"}]}
           {:id 1 :another "a1" :props [{:id2 5 :name "n2"}]}]}
     {:f1 [{:id 1 :another "a1_old" :props [{:id2 5 :name "o2"}]}
           {:id 2 :another "a2_old" :props [{:id2 4 :name "o1"}]}]}))

   [{:keys {:id 2}, :key :another, :spec-val ["a2"], :status-val ["a2_old"]}
    {:keys {:id 1}, :key :another, :spec-val ["a1"], :status-val ["a1_old"]}
    {:keys {:id 2, :id2 4}, :key :name, :spec-val ["n1"], :status-val ["o1"]}
    {:keys {:id 1, :id2 5}, :key :name, :spec-val ["n2"], :status-val ["o2"]}])


(optimize-ast(insta/parse sfs-parser "f1.{id}.[another,props.{id2}.name]"))

(def a (sfs-compiler (optimize-ast(insta/parse sfs-parser "f1.{id}.[another,props.{id2}.name]"))))

((sfs-compiler (optimize-ast (insta/parse sfs-parser "f1.{id}.[another, props.{id2}.name]")))
 (prepare
     {:f1 [{:id 2 :another "a2" :props [{:id2 4 :name "n1"}]}
           {:id 1 :another "a1" :props [{:id2 5 :name "n2"}]}]}
     {:f1 [{:id 1 :another "a1_old" :props [{:id2 5 :name "o2"}]}
           {:id 2 :another "a2_old" :props [{:id2 4 :name "o1"}]}]}))


(a
 (prepare
  {"f1" [{"id" 2 "another" "a2" "props" [{"id2" 4 "name" "n1"}]}
         {"id" 1 "another" "a1" "props" [{"id2" 5 "name" "n2"}]}]}
  {"f1" [{"id" 1 "another" "a1_old" "props" [{"id2" 5 "name" "o2"}]}
         {"id" 2 "another" "a2_old" "props" [{"id2" 4 "name" "o1"}]}]}))

(optimize-ast (insta/parse sfs-parser "a.{b}.c.[d]"))


(defn ^:export clj_str[a]
  (str a))

(defn ^:export parse_sfs[sfs-signature]
  (insta/parse sfs-parser sfs-signature))

(defn ^:export optimize_sfs_ast[ast]
  (optimize-ast ast))

(defn ^:export compile_sfs_ast[ast]
  (sfs-compiler ast))

(defn ^:export compile_sfs[sfs-signature]
  (let [sfs-fn (some-> sfs-signature
                       parse_sfs
                       optimize-ast
                       sfs-compiler
                       )]
    (if (fn? sfs-fn) sfs-fn {:error-compiling-sfs :sfs-fn
                             :sfs-signature sfs-signature})))

(defn ^:export run_compiled_sfs[compiled-sfs-fn spec status]
  (compiled-sfs-fn (prepare spec status))) 
