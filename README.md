# papiea-js
<img src="https://upload.wikimedia.org/wikipedia/commons/1/13/Papaya.svg" width="150" height="150">

Papiea, pronounced like the fruit, is an Intent engine based on perscriptions or recipes for handling differences
between intended state and real world state.

# Design document
Please see [Papiea's design document](https://nutanix.github.io/papiea-js/Papiea-design.html)

# Build Instructions
There are two components that for now are needed to be built separatly:

1. Papiea itself using `npm run build`.

1. The clojure-script parts of `intentful-core`.

At the project's root directory, run either `npm run build-clj` to build once or `npm run build-clj-auto` to have a file system listener that build automatically and runs all tests on every file change.

Alternatively run `docker-compose up` to install all dependencies, build the application and run nodejs server.

# CLJS instructions
For now this clojurescript library is embedded, but it may end up in a different repository and will be exposed as a regular npm package which will be imported through npm. Until this happens, here are the instructions for developing this library:

1. Make sure `leiningen` is installed (follow https://github.com/technomancy/leiningen#installation)
1. To use live repl with clojurescript do the following:
```bash
cd papiea-lib-clj
lein repl
```
and inside the repl type:
```clojure
(require 'cljs.repl.nashorn)
(cider.piggieback/cljs-repl (cljs.repl.nashorn/repl-env))
```
Then go to emacs with cider installed (https://github.com/clojure-emacs/cider#installation), do `M+x cider-connect-cljs`, select the host where the repl is running (usually localhost, but can be run anywhere. Use `.ssh/config` to name that host), then select `node` as the running environment and you should have a repl. Debugging is not yet working in cljs, but I simply use regular clojure if I need to live debug for now.

# License and copyright

Copyright (C) 2018 Nutanix

The code in the public repositories is licensed under the Apache
license.

Licensed under the Apache License, Version 2.0 (the "License"); you
may not use this file except in compliance with the License.  You may
obtain a copy of the License at

http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or
implied.  See the License for the specific language governing
permissions and limitations under the License.
