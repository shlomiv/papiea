(ns papiea-lib-clj.core
  (:require [cljs.nodejs :as nodejs]
            [instaparse.core :as insta]))

(nodejs/enable-util-print!)

(def sfs-parser
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

(insta/parses sfs-parser "a.v.[+{a}.a,d]")


(def sfs-parser
  (insta/parser
   "S = complex
    complex = (simple | vector | group)+
    group  = <'['> complex (<','> complex)*  <']'>
    simple = path
    <path> = field (<'.'> field)*
    vector = (add | del | change) <'{'> path <'}'>
    add = <'+'>
    del = <'-'>
    change = epsilon
    <field> = #'[a-zA-Z_0-9]+'    
    "))

(insta/parses sfs-parser "{a}.s.a")



[:S [:complex [:simple "a"] [:simple "v"] [:group [:complex [:vector [:add] "a"] [:simple "a"]] [:complex [:simple "d"]]]]]


(defn ^:export foo[a b]
  (println "WITH BAR NO!!!" a b (q a) )
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


(defmulti sfs-compiler (fn[x] (first x)))

(defmethod sfs-compiler :papiea/simple [[_ & ks]]
  (fn[results]
    (mapv (fn[{:keys [keys key spec-val status-val]}]
            (let [s1 (mapv #(get-in % ks) spec-val)
                  s2 (mapv #(get-in % ks) status-val)
                  empty (or (empty? s1) (empty? s2))]
              {:keys keys
               :key (if empty key (last ks))
               :spec-val  (if empty spec-val (flat-choices s1))
               :status-val (if empty status-val (flat-choices s2))}))
          results)))

(defmethod sfs-compiler :papiea/vector [[_ & ks]]
  (fn[results]
    (into []
          (mapcat (fn[{:keys [keys key spec-val status-val]}]
                    (let [g (group-by #(get-in % ks)
                                      (into
                                       (mapv #(assoc % :papiea/spec true) spec-val)
                                       (mapv #(assoc % :papiea/status true) status-val)))]
                      (mapv (fn[[id-val [s1 s2]]]              
                              {:keys (assoc keys (last ks) id-val)
                               :key key
                               :spec-val (ensure-vec(cond (:papiea/spec s1) (dissoc s1 :papiea/spec)
                                                          (:papiea/spec s2) (dissoc s2 :papiea/spec)
                                                          :else nil))
                               :status-val (ensure-vec(cond (:papiea/status s1) (dissoc s1 :papiea/status)
                                                            (:papiea/status s2) (dissoc s2 :papiea/status)
                                                            :else nil))})
                            g)))
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


(=((sfs-compiler[:papiea/vector :id])
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


(= ((sfs-compiler [:papiea/complex [:papiea/simple :f1] [:papiea/vector :id] [:papiea/simple :props] [:papiea/vector :id2] [:papiea/simple :name]])
    (prepare
     {:f1 [{:id 2 :props [{:id2 4 :name "n1"}]}
           {:id 1 :props [{:id2 5 :name "n2"}]}]}
     {:f1 [{:id 1 :props [{:id2 5 :name "o2"}]}
           {:id 2 :props [{:id2 4 :name "o1"}]}]}))
   
   [{:keys {:id 2, :id2 4}, :key :name, :spec-val ["n1"], :status-val ["o1"]}
    {:keys {:id 1, :id2 5}, :key :name, :spec-val ["n2"], :status-val ["o2"]}])


(= ((sfs-compiler [:papiea/complex [:papiea/simple :f1] [:papiea/vector :id]
           [:papiea/group
            [:papiea/simple :another]
            [:papiea/complex[:papiea/simple :props] [:papiea/vector :id2] [:papiea/simple :name]]]])
    (prepare
     {:f1 [{:id 2 :another "a2" :props [{:id2 4 :name "n1"}]}
           {:id 1 :another "a1" :props [{:id2 5 :name "n2"}]}]}
     {:f1 [{:id 1 :another "a1_old" :props [{:id2 5 :name "o2"}]}
           {:id 2 :another "a2_old" :props [{:id2 4 :name "o1"}]}]}))

   [{:keys {:id 2}, :key :another, :spec-val ["a2"], :status-val ["a2_old"]}
    {:keys {:id 1}, :key :another, :spec-val ["a1"], :status-val ["a1_old"]}
    {:keys {:id 2, :id2 4}, :key :name, :spec-val ["n1"], :status-val ["o1"]}
    {:keys {:id 1, :id2 5}, :key :name, :spec-val ["n2"], :status-val ["o2"]}])

