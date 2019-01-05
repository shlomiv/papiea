(ns papiea-lib-clj.core
  (:require [cljs.nodejs :as nodejs]
            [papiea-lib-clj.sfs :as sfs]))

(nodejs/enable-util-print!)

;;; Exporting functionality to javascript land
(defn ^:export clj_str[a]
  (str a))

(defn ^:export parse_sfs[sfs-signature]
  (insta/parse sfs/sfs-parser sfs-signature))

(defn ^:export optimize_sfs_ast[ast]
  (sfs/optimize-ast ast))

(defn ^:export compile_sfs_ast[ast]
  (sfs/sfs-compiler ast))

(defn ^:export compile_sfs[sfs-signature]
  (let [sfs-fn (some-> sfs/sfs-signature
                       sfs/parse_sfs
                       sfs/optimize-ast
                       sfs/sfs-compiler
                       )]
    (if (fn? sfs-fn) sfs-fn {:error-compiling-sfs :sfs-fn
                             :sfs-signature sfs-signature})))

(defn ^:export run_compiled_sfs[compiled-sfs-fn spec status]
  (let [spec (js->clj spec)
        status (js->clj status)
        results (sfs/prepare spec status)]
    (clj->js (compiled-sfs-fn results)))) 

(defn -main [& args]
  (println "Hello world"))

(set! *main-cli-fn* -main)
