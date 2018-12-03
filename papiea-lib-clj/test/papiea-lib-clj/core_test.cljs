(ns papiea-lib-clj.core-test
  (:require [cljs.test :refer-macros [deftest testing is]]
            [instaparse.core :as insta]
            [papiea-lib-clj.core :as c]))

(deftest ambigous-parser
  ;; An example of the original, ambigous parser
  (let [sfs-parser-ambigous (insta/parser
                             "S       = complex
                              complex = (simple | vector | group)+
                              group   = <'.'>? <'['> complex (<','> complex)*  <']'>
                              simple  = <'.'>? path
                              <path>  = field (<'.'> field)*
                              vector  = <'.'>? (add | del | change) <'{'> path <'}'>
                              add     = <'+'>
                              del     = <'-'>
                              change  = epsilon
                              <field> = #'[a-zA-Z_0-9]+'    
                              ")]
    (testing "ambigous parser returns multiple results"
      (is (= (insta/parses sfs-parser-ambigous "a.v.[+{a}.a,d]")
             [[:S
               [:complex
                [:simple "a"]
                [:simple "v"]
                [:group
                 [:complex [:vector [:add] "a"] [:simple "a"]]
                 [:complex [:simple "d"]]]]]
              [:S
               [:complex
                [:simple "a" "v"]
                [:group
                 [:complex [:vector [:add] "a"] [:simple "a"]]
                 [:complex [:simple "d"]]]]]]))))) 

(deftest unambiguous-parser
  (testing "unambiguous parser returns a single result"
    (is (= (insta/parses c/sfs-parser "a.v.[+{a}.a,d]")
           [[:S
             [:complex
              [:simple "a" "v"]
              [:group
               [:complex [:vector [:add] "a"] [:simple "a"]]
               [:simple "d"]]]]])))
  
  (testing "Ability to have a mix of simple, complex and grouping of any length, without introducing ambiguity"
    (is(= (insta/parses c/sfs-parser "a.1.2.{b.1.2}.c.1.2.[d.1.2].e.1.2.{d.1.2}")
          [[:S
             [:complex
              [:simple "a" "1" "2"]
              [:vector [:change] "b" "1" "2"]
              [:simple "c" "1" "2"]
              [:group [:simple "d" "1" "2"]]
              [:simple "e" "1" "2"]
              [:vector [:change] "d" "1" "2"]]]])))

  (testing "Check vector add, del, change and group"
    (is (= (insta/parse c/sfs-parser "a.-{s.c}.[+{d},f.{d}.f.d]")
           [:S
            [:complex
             [:simple "a"]
             [:vector [:del] "s" "c"]
             [:group
              [:complex [:vector [:add] "d"]]
              [:complex
               [:simple "f"]
               [:vector [:change] "d"]
               [:simple "f" "d"]]]]]))))

(deftest get-in-keyword-insensitive
  (testing "get-in' should be able to get values when we consistently use either strings or keywords for keys in the data"
    (is (= (c/get-in' {:f {:v 3}} ["f" "v"]) 3))
    (is (= (c/get-in' {:f {:v 3}} [:f :v]) 3))
    (is (= (c/get-in' {"f" {"v" 3}} [:f :v]) 3))
    (is (= (c/get-in' {"f" {"v" 3}} ["f" "v"]) 3)))
  (testing "mixing keywords in the path should work"
    (is (= (c/get-in' {"f" {"v" 3}} [:f "v"]) 3)))
  (testing "mixing keywords in datastructure does not work"
    (is (nil? (c/get-in' {"f" {:v 3}} ["f" "v"])))
    (is (nil? (c/get-in' {"f" {:v 3}} [:f :v])))))
 

(deftest prepare
  (testing "creating an initial context from a spec/status pair"
    (is (= (c/prepare
            ;; Spec portion
            {:f1 [{:id 2 :props [{:id2 4 :name "n1"}]}
                  {:id 1 :props [{:id2 5 :name "n2"}]}]}

            ;; Status portion
            {:f1 [{:id 1 :props [{:id2 5 :name "o2"}]}
                  {:id 2 :props [{:id2 4 :name "o1"}]}]})

           [{:keys {},
             :key :papiea/item,
             :spec-val
             [{:f1
               [{:id 2, :props [{:id2 4, :name "n1"}]}
                {:id 1, :props [{:id2 5, :name "n2"}]}]}],
             :status-val
             [{:f1
               [{:id 1, :props [{:id2 5, :name "o2"}]}
                {:id 2, :props [{:id2 4, :name "o1"}]}]}]}]))))

(deftest compiler
  (testing "simple"
    (is (= ((c/sfs-compiler[:papiea/simple :name])
            [{:keys {} :key :papiea/item
              :spec-val [{:name "old"}]
              :status-val [{:name "new"}]}])
           
           [{:keys {}, :key :name, :spec-val ["old"], :status-val ["new"]}]))

    (is (= ((c/sfs-compiler[:papiea/simple :v])
            [{:keys {} :key :papiea/item
              :spec-val [{:v [{:name "old"}
                              {:name "a"}]}]
              :status-val [{:v [{:name "new"}
                                {:name "n"}]}]}])
           
           [{:keys {},
             :key :v,
             :spec-val [{:name "old"} {:name "a"}],
             :status-val [{:name "new"} {:name "n"}]}]))

    (testing "given a previous context"
      (is (= ((c/sfs-compiler [:papiea/simple :name])
              [{:keys {:id 1} :key :papiea/item :spec-val [{:id 1 :name "old1"}] :status-val [{:id 1 :name "new1"}]}
               {:keys {:id 2} :key :papiea/item :spec-val [{:id 2 :name "old2"}] :status-val [{:id 2 :name "new2"}]}
               {:keys {:id 3} :key :papiea/item :spec-val [] :status-val [{:id 3 :name "old3"}]}])
             
             [{:keys {:id 1}, :key :name, :spec-val ["old1"], :status-val ["new1"]}
              {:keys {:id 2}, :key :name, :spec-val ["old2"], :status-val ["new2"]}
              {:keys {:id 3}, :key :papiea/item, :spec-val [], :status-val [{:id 3, :name "old3"}]}]))
      )
    
    )

  (testing "vector"
    (testing "all changes"
      (is (= ((c/sfs-compiler[:papiea/vector [:all] :id])
              [{:keys       {} :key :papiea/item
                :spec-val   [{:id 1 :name "old1"} {:id 2 :name "old2"}]
                :status-val [{:id 2 :name "new2"} {:id 1 :name "new1"} {:id 3 :name "old3"}]}])
             
             [{:keys {:id 1} :key :papiea/item :spec-val [{:id 1 :name "old1"}] :status-val [{:id 1 :name "new1"}]}
              {:keys {:id 2} :key :papiea/item :spec-val [{:id 2 :name "old2"}] :status-val [{:id 2 :name "new2"}]}
              {:keys {:id 3} :key :papiea/item :spec-val [] :status-val [{:id 3 :name "old3"}]}])))

    (testing "`add` changes"
      (is (= ((c/sfs-compiler[:papiea/vector [:add] :id])
              [{:keys       {} :key :papiea/item
                :spec-val   [{:id 1 :name "old1"} {:id 2 :name "old2"} {:id 4 :name "new4"}]
                :status-val [{:id 2 :name "new2"} {:id 1 :name "new1"} {:id 3 :name "old3"}]}])
             
             [{:keys {:id 4},
               :key :papiea/item,
               :spec-val [{:id 4, :name "new4"}],
               :status-val []}])))

    (testing "`del` changes"
      (is (= ((c/sfs-compiler[:papiea/vector [:del] :id])
              [{:keys       {} :key :papiea/item
                :spec-val   [{:id 1 :name "old1"} {:id 2 :name "old2"}]
                :status-val [{:id 2 :name "new2"} {:id 1 :name "new1"} {:id 3 :name "old3"}]}])

             [{:keys {:id 3},
               :key :papiea/item,
               :spec-val [],
               :status-val [{:id 3, :name "old3"}]}]
             ))))

  (testing "group"
    (is (= ((c/sfs-compiler [:papiea/group [:papiea/simple :name] [:papiea/simple :age]])
            (c/prepare
             {:name "a" :age 23}
             {:name "b" :age 12}))

           [{:keys {} :key :name :spec-val ["a"] :status-val ["b"]}
            {:keys {} :key :age :spec-val [23] :status-val [12]}])))

  (testing "complex"
    (is (= ((c/sfs-compiler [:papiea/complex [:papiea/simple :f1] [:papiea/vector [:all] :id] [:papiea/simple :props] [:papiea/vector [:all] :id2] [:papiea/simple :name]])
            (c/prepare
             {:f1 [{:id 2 :props [{:id2 4 :name "n1"}]}
                   {:id 1 :props [{:id2 5 :name "n2"}]}]}
             {:f1 [{:id 1 :props [{:id2 5 :name "o2"}]}
                   {:id 2 :props [{:id2 4 :name "o1"}]}]}))
           
           [{:keys {:id 2, :id2 4}, :key :name, :spec-val ["n1"], :status-val ["o1"]}
            {:keys {:id 1, :id2 5}, :key :name, :spec-val ["n2"], :status-val ["o2"]}]))


    (is (= ((c/sfs-compiler [:papiea/complex
                           [:papiea/simple :f1]
                           [:papiea/vector [:all] :id]
                           [:papiea/group
                            [:papiea/simple :another]
                            [:papiea/complex
                             [:papiea/simple :props]
                             [:papiea/vector [:all] :id2]
                             [:papiea/simple :name]]]])
            (c/prepare
             {:f1 [{:id 2 :another "a2" :props [{:id2 4 :name "n1"}]}
                   {:id 1 :another "a1" :props [{:id2 5 :name "n2"}]}]}
             {:f1 [{:id 1 :another "a1_old" :props [{:id2 5 :name "o2"}]}
                   {:id 2 :another "a2_old" :props [{:id2 4 :name "o1"}]}]}))

           [{:keys {:id 2}, :key :another, :spec-val ["a2"], :status-val ["a2_old"]}
            {:keys {:id 1}, :key :another, :spec-val ["a1"], :status-val ["a1_old"]}
            {:keys {:id 2, :id2 4}, :key :name, :spec-val ["n1"], :status-val ["o1"]}
            {:keys {:id 1, :id2 5}, :key :name, :spec-val ["n2"], :status-val ["o2"]}]))))

(deftest optimizer
  (testing "optimizer adds namepsaces to the AST node keywords"
    (testing "not optimized"
      (is (= (insta/parse c/sfs-parser "f1.{id}.[another,props.{id2}.name]")

             [:S
              [:complex
               [:simple "f1"]
               [:vector [:change] "id"]
               [:group
                [:simple "another"]
                [:complex
                 [:simple "props"]
                 [:vector [:change] "id2"]
                 [:simple "name"]]]]])))

    (testing "optimized"
      (is 
       (= (c/optimize-ast (insta/parse c/sfs-parser "f1.{id}.[another,props.{id2}.name]"))

          [:papiea/complex
           [:papiea/simple "f1"]
           [:papiea/vector [:change] "id"]
           [:papiea/group
            [:papiea/simple "another"]
            [:papiea/complex
             [:papiea/simple "props"]
             [:papiea/vector [:change] "id2"]
             [:papiea/simple "name"]]]]))))

  (testing "optimizer removes singelton `complex` nodes,"
    (testing "not optimized"
      (is 
       (= (insta/parse c/sfs-parser "[{a.v},d]")

          [:S
           [:complex   ;; Singleton complex, can be eliminated
            [:group
             [:complex [:vector [:change] "a" "v"]] ;; same 
             [:simple "d"]]]])))
    
    (testing "optimized"
      (is 
       (= (c/optimize-ast (insta/parse c/sfs-parser "[{a.v},d]"))
          [:papiea/group
           [:papiea/vector [:change] "a" "v"]
           [:papiea/simple "d"]])))))

(deftest complete-compiler-test
  (testing "Multiple features: parsing, optimizing, compiling and running with grouping where one branch has another vector. See the `:keys` attribute in the results."

    (testing "Test using clojure native structures using keywords")
    (is (= ((c/sfs-compiler (c/optimize-ast (insta/parse c/sfs-parser "f1.{id}.[another, props.{id2}.name]")))
            (c/prepare
             {:f1 [{:id 2 :another "a2" :props [{:id2 4 :name "n1"}]}
                   {:id 1 :another "a1" :props [{:id2 5 :name "n2"}]}]}
             {:f1 [{:id 1 :another "a1_old" :props [{:id2 5 :name "o2"}]}
                   {:id 2 :another "a2_old" :props [{:id2 4 :name "o1"}]}]}))

           [{:keys {"id" 2},:key "another",:spec-val ["a2"],:status-val ["a2_old"]}
            {:keys {"id" 1},:key "another",:spec-val ["a1"],:status-val ["a1_old"]}
            {:keys {"id" 2, "id2" 4},:key "name",:spec-val ["n1"],:status-val ["o1"]}
            {:keys {"id" 1, "id2" 5},:key "name",:spec-val ["n2"],:status-val ["o2"]}]))

    (testing "Test using javascript-like stracture using strings"
      (is (= ((c/sfs-compiler (c/optimize-ast (insta/parse c/sfs-parser "f1.{id}.[another, props.{id2}.name]")))
              (c/prepare
               {"f1" [{"id" 2 "another" "a2" "props" [{"id2" 4 "name" "n1"}]}
                      {"id" 1 "another" "a1" "props" [{"id2" 5 "name" "n2"}]}]}
               {"f1" [{"id" 1 "another" "a1_old" "props" [{"id2" 5 "name" "o2"}]}
                      {"id" 2 "another" "a2_old" "props" [{"id2" 4 "name" "o1"}]}]}))

           [{:keys {"id" 2},:key "another",:spec-val ["a2"],:status-val ["a2_old"]}
            {:keys {"id" 1},:key "another",:spec-val ["a1"],:status-val ["a1_old"]}
            {:keys {"id" 2, "id2" 4},:key "name",:spec-val ["n1"],:status-val ["o1"]}
            {:keys {"id" 1, "id2" 5},:key "name",:spec-val ["n2"],:status-val ["o2"]}]))
      ) ) )
