(ns papiea-lib-clj.ordering
  (:require [papiea-lib-clj.sfs :as sfs]))

(defn depth
  "Returns the depth of a tree"
  [xs] (if (vector? xs)
         (inc (reduce max -1 (map depth xs)))
         0))

(defn order-sfss
  "Order the sfss based on their depth (our measure of specificity) and
  the manual dependency tree provided. deps is a map from sfs to a set
  of dependent sfss"
  [sfss deps] (let [asts   (map (comp sfs/optimize-ast sfs/sfs-parser) sfss)
                    depths (map depth asts)

                    ;; Sorting is done by looking at deps
                    ordered (sort-by identity (fn[[_ depth-a sfs-a] [_ depth-b sfs-b]]
                                                (cond (get (get deps sfs-a) sfs-b) -1
                                                      (get (get deps sfs-b) sfs-a) 1
                                                      :else (>= depth-a depth-b)))
                                     (map vector asts depths sfss))]
                (map first ordered)))


(def sfss ["age" "name" "[name, age]"])

(order-sfss sfss  {"name" #{"[name, age]"}})


(def r [[[:S [:papiea/group [:papiea/simple "name"] [:papiea/simple "age"]]] 3 "[name, age]"]
        [[:S [:papiea/simple "name"]] 2 "name"]])


(def deps {"name" #{"[name, age]"}})

