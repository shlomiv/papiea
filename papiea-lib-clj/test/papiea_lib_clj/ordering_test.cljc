(ns papiea-lib-clj.ordering-test
  (:require #?(:clj [clojure.test :refer [deftest testing is]]
               :cljs [cljs.test :refer-macros [deftest testing is]])
            [papiea-lib-clj.ordering :as o]))

(testing "no sfss"
  (testing "and no deps"
    (is (= (o/order-sfss [] {}) [])))
  (testing "and some deps"
    (is (= (o/order-sfss [] {"a" #{"b"}}) []))))

(testing "some sfss"
  (testing "no explicit deps"
    (is (#{["[name, age]" "age" "name"]
           ["[name, age]" "name" "age"]}
         (map first (o/order-sfss ["age" "name" "[name, age]"] {}))))

    (is (#{["[name, age]" "age" "name"]
           ["[name, age]" "name" "age"]}
         (map first (o/order-sfss ["name" "age" "[name, age]"] {}))
         ))

    (is (= (map first (o/order-sfss ["name" "[name, a.{b}.[c,d]]" "[name, age]"] {}))
           ["[name, a.{b}.[c,d]]" "[name, age]" "name"]))

    (is (= (map first (o/order-sfss ["very.long.name.which.should.be.last" "[name, a.{b}.[c,d]]" "[name, age]"] {}))
           ["[name, a.{b}.[c,d]]"
            "[name, age]"
            "very.long.name.which.should.be.last"])))

  (testing "same depth"
    (testing "no deps"
      (is (#{["a" "b" "c"]
             ["a" "c" "b"]
             ["b" "a" "c"]
             ["b" "c" "a"]
             ["c" "a" "b"]
             ["c" "b" "a"]}
           (map first (o/order-sfss ["a" "b" "c"] {}))
               ))

      (is (#{["[c,d]" "[a,b]" "[b,c.q]"]
             ["[c,d]" "[b,c.q]" "[a,b]"]
             ["[a,b]" "[c,d]" "[b,c.q]"]
             ["[a,b]" "[b,c.q]" "[c,d]"]
             ["[b,c.q]" "[a,b]" "[c,d]"]
             ["[b,c.q]" "[c,d]" "[a,b]"]}

           (map first (o/order-sfss ["[a,b]" "[b,c.q]" "[c,d]"] {}))
             )))

    (testing "with deps"
      (is (#{["a" "c" "b"]
             ["c" "a" "b"]
             ["c" "b" "a"]}
           (map first (o/order-sfss ["a" "b" "c"] {"c" #{"b"}}))))

      (testing "trasitive deps"
        (is (#{["[c,d]" "[a,b]" "[b,c.q]"]
               ["[c,d]" "[b,c.q]" "[a,b]"]
               ["[b,c.q]" "[c,d]" "[a,b]"]}
             (map first (o/order-sfss ["[a,b]" "[b,c.q]" "[c,d]"] {"[c,d]" #{"[a,b]"}})))))))

  (testing "different depths"
    (testing "no deps"
      (is (#{["[b,q]" "a" "c"]
             ["[b,q]" "c" "a"]}
           (map first (o/order-sfss ["a" "[b,q]" "c"] {}))))

      (is (#{["[b,[c,q]]" "[c,d]" "[a,b]"]
             ["[b,[c,q]]" "[a,b]" "[c,d]"]}

           (map first (o/order-sfss ["[a,b]" "[b,[c,q]]" "[c,d]"] {})))))

    (testing "with deps"
      (is (= (map first (o/order-sfss ["[a,q]" "b" "c"] {"c" #{"b"}}))
             ["[a,q]" "c" "b"]))

      (testing "trasitive deps"
        (is (= (map first (o/order-sfss ["[a,b]" "[b,[c.q,l]]" "[c,d]"] {"[c,d]" #{"[a,b]"}}))
               ["[b,[c.q,l]]" "[c,d]" "[a,b]"])))

      (testing "deps crossing depths"
        (is (= (map first (o/order-sfss ["[a,b]" "[b,[c.q,l]]" "[c,d]"] {"[c,d]" #{"[b,[c.q,l]]"}}))
               ["[c,d]" "[b,[c.q,l]]" "[a,b]"]))))))
