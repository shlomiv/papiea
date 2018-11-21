(ns papiea-lib-clj.core
  (:require [cljs.nodejs :as nodejs]
            [instaparse.core :as insta]))

(nodejs/enable-util-print!)

(def q
  (insta/parser
   "S = AB+
    AB = A B
    A = 'a'+
    B = 'b'+"))

(q "aabbbbb")

(defn ^:export foo[a b]
  (println "WITH BAR NO!!!" a b (q a) )
  (str a "." b))

(defn -main [& args]
  (println "Hello world"))

(set! *main-cli-fn* -main)
