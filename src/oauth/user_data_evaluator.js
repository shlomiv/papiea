"use strict";
exports.__esModule = true;
var _ = require("lodash");
var JSON = require("node-json-color-stringify");
var color = require("colors");
var str = function (x) { return JSON.colorStringify(x, null, 2); };
// Taken from https://git.coolaj86.com/coolaj86/atob.js/src/branch/master/node-atob.js#L3-L5
function atob(str) {
    return Buffer.from(str, 'base64').toString('binary');
}
exports.atob = atob;
function parseJwt(token) {
    // partly from https://stackoverflow.com/a/38552302
    if (token) {
        var token_parts = token.split('.');
        var header_base64Url = token_parts[0];
        var header = {};
        if (header_base64Url) {
            var header_base64 = header_base64Url.replace(/-/g, '+').replace(/_/g, '/');
            header = JSON.parse(atob(header_base64));
        }
        var content_base64Url = token_parts[1];
        var content = {};
        if (content_base64Url) {
            var content_base64 = content_base64Url.replace(/-/g, '+').replace(/_/g, '/');
            content = JSON.parse(atob(content_base64));
        }
        return { header: header, content: content };
    }
    return { header: {}, content: {} };
}
exports.parseJwt = parseJwt;
;
function is_reference(line) {
    return (_.isString(line) && line[0] == '^');
}
function get_reference(line) {
    if (!is_reference(line))
        throw new Error("'" + line + "' not a reference.");
    return line.substring(1);
}
function is_function(line) {
    return (_.isString(line) && line[0] == "$");
}
function get_function(line) {
    if (!is_function(line))
        throw new Error("'" + line + "' not a function.");
    return line.substring(1);
}
function is_first_match(val) {
    return (_.isObject(val) && _.isEqual(_.keys(val), ['first_match']));
}
var funcNameParamRegex = /([^\.]+)\(([^)]+)\)/;
function deref(env, query_inp) {
    //console.log("Inside with", query_inp)
    var reference = is_reference(query_inp);
    // If we are not a reference, than the input is already a const
    if (!reference)
        return query_inp;
    var query = get_reference(query_inp);
    // query is built on parts between the dots
    var parts = query.split('.');
    // define a lambda that process a single part
    var part_processor = function (part_env, current_part) {
        if (!part_env)
            return null;
        if (is_function(current_part)) {
            // Get parameters
            var func = get_function(current_part);
            var matches = funcNameParamRegex.exec(func);
            switch ((matches && matches[1]) || func) {
                case 'JWT':
                    return parseJwt(part_env);
                case 'find':
                    var _a = matches[2].split(':'), k_1 = _a[0], v_1 = _a[1];
                    return _.find(part_env, function (x) { return x[k_1] == v_1; });
            }
        }
        else { // current_part is an index into an object or array returned in part_env
            var value = part_env[current_part];
            if (!value)
                throw Error(color.red("Variable, index or key '" + color.yellow(current_part) + "' not found in:\n" + str(part_env)));
            if (is_first_match(value)) {
                return _.find(_.map(value.first_match, function (x) { return deref(env, x); }));
            }
            else if (!is_reference(value)) {
                // If it is not a reference or a directive, then it is an already resolved value
                return value;
            }
            else {
                // its a reference query, recursively process the query
                var r = deref(env, value);
                // memoize it by replacing the dereferenced value in the env for next executions
                env[current_part] = r;
                return r;
            }
        }
    };
    // each part operates on the value returned by processing the previous part
    return _.reduce(parts, part_processor, env);
}
exports.deref = deref;
function evaluate_headers(env, headers) {
    return _.mapValues(headers, function (v) { return deref(env, v); });
}
exports.evaluate_headers = evaluate_headers;
