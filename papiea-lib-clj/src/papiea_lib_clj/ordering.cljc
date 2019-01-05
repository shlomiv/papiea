(ns papiea-lib-clj.ordering
  (:require [papiea-lib-clj.sfs :as sfs]
            [papiea-lib-clj.kahn :refer [kahn-sort]]))

(defn depth
  "Returns the depth of a tree"
  [xs] (if (vector? xs)
         (inc (reduce max -1 (map depth xs)))
         0))

(defn ordered-to-deps [sfs-with-depths deps]
  (let [groups (group-by first sfs-with-depths)
        ks (keys groups)]
    (if (= 1 (count ks))
      (merge-with clojure.set/union deps
                  (into (sorted-map) (map (fn[x] [(second x) #{}]) (get groups (first ks)))))
      (let [ks (reverse (sort ks))]
        (merge-with
         clojure.set/union
         deps
         (into (sorted-map)
               (mapcat (fn[p n]
                         (let [p (get groups p)
                               n (get groups n)]
                           (map (fn[x]
                                  (let [before (second x)]
                                    [before
                                     (into #{}
                                           (->>
                                            (map second n)
                                            (remove (fn[x] (get (get deps x) before)))
                                            ))])) p)))
                       ks (rest ks))))))))

(defn order-sfss
  "Order the sfss based on their depth (our measure of specificity) and
  the manual dependency tree provided. deps is a map from sfs to a set
  of dependent sfss"
  [sfss deps]
  (if (pos? (count sfss))
    (let [asts   (map (comp sfs/optimize-ast sfs/sfs-parser) sfss)
          depths (map depth asts)
          cache  (into {} (map vector sfss asts))
          sorted (kahn-sort (ordered-to-deps (map vector depths sfss) deps))]
      (map (juxt identity cache) sorted))
    []))
