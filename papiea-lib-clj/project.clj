(defproject nutanix.cto/papiea-lib-clj "0.1.0-SNAPSHOT"
  :description "FIXME: write this!"
  :url "http://example.com/FIXME"

  :dependencies [[org.clojure/clojure "1.9.0"]
                 [org.clojure/clojurescript "1.10.439"]
                 [instaparse "1.4.9"]
                 [cider/piggieback "0.3.10"]]

  :plugins [[lein-cljsbuild "1.1.7"]]
  :repl-options {:nrepl-middleware [cider.piggieback/wrap-cljs-repl]}
  
  :source-paths ["src"]

  :cljsbuild {:builds [{:source-paths ["src"]
                        :compiler {:target :nodejs
                                   :output-to "papiea-lib-clj.js"
                                   :optimizations :simple}}]})
