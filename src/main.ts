var express = require('express');
var app = express();

var papi_clj = require("../papiea-lib-clj/papiea-lib-clj.js").papiea_lib_clj;

export const Greeter = (name: string) => `Hello!! ${name}`; 

console.log(Greeter(papi_clj.core.foo("aaabaabbb", 3)));


export const clj_str = (a:any) => papi_clj.core.clj_str(a);
export const sfs_compile = (sfs_signature: string) => papi_clj.core.compile_sfs(sfs_signature);
export const sfs_parser = (sfs_ast: string) => papi_clj.core.parse_sfs(sfs_ast);
export const sfs_optimizer = (sfs_ast: string) => papi_clj.core.optimize_sfs_ast(sfs_ast);
export const sfs_compiler = (sfs_signature: string) => papi_clj.core.compile_sfs(sfs_signature);
export const run_compiled_sfs = (compiled_sfs:any, spec:any, status:any) => papi_clj.core.run_compiled_sfs(compiled_sfs, spec, status);

console.log("print simple sfs ast for: 'a'")
console.log(clj_str(sfs_parser("a")))
console.log("")
console.log("print complex sfs ast for: 'f1.{id}.[another, props.{id2}.name]'")
console.log(clj_str(sfs_parser("f1.{id}.[another, props.{id2}.name]")))

console.log("")
console.log("print non-optimized sfs ast for: '[{a.v},d]'")
console.log(clj_str(sfs_parser("[{a.v},d]")))

console.log("")
console.log("print optimized sfs ast for: '[{a.v},d]'") // simpler case {a.v}
console.log(clj_str(sfs_optimizer(sfs_parser("[{a.v},d]"))))

console.log("")

app.get('/', function (req:any, res:any) {
  res.send('Hello World!');
});

app.listen(3000, function () {
  console.log('Example app listening on port 3000!');
});
