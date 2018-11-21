var express = require('express');
var app = express();

var papi_clj = require("../papiea-lib-clj/papiea-lib-clj.js").papiea_lib_clj;

export const Greeter = (name: string) => `Hello!! ${name}`; 

console.log(Greeter(papi_clj.core.foo("aaabaabbb", 3)));

console.log("I am in type script")

app.get('/', function (req:any, res:any) {
  res.send('Hello World!');
});

app.listen(3000, function () {
  console.log('Example app listening on port 3000!');
});
