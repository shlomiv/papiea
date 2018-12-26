// [[file:~/work/papiea-js/Papiea-design.org::*/src/intentful_core/differ_interface.ts][/src/intentful_core/differ_interface.ts:1]]
import * as core from "../core";
import * as papiea from "../papiea";

// [[file:~/work/papiea-js/Papiea-design.org::#h-Differ-118][Differ-interface]]
export interface Kind_Compiler {
    // The sfss compiler function. 
    compile_kind_explicit(sfss: core.SFS[], dep_tree: Map<core.SFS, core.SFS[]>): Differ;

    // More concisely this could simply be:
    compile_kind(kind: papiea.Kind): Differ;
}

// The differ is used to locate a diff in an entity between the
// current status and the desired state. 
export interface Differ {

    // Get the next diff from an entity based on the 
    next_diff(entity:core.Entity_Reference, spec: core.Spec, status: core.Status):Diff;

    // We could also get the entire list of diffs, ordered by the
    // original dependency tree
    all_diffs(entity:core.Entity_Reference, spec: core.Spec, status: core.Status):Diff[];
}
// Differ-interface ends here

// [[file:~/work/papiea-js/Papiea-design.org::#h-Intentful-Execution-821][Diff-interface]]
// The Diff structure captures a discovered diff in an entity as well
// as the intentful action that may resolve such diff
export interface Diff {
    // The uri exposed by the provider which may handle this diff
    intentful_fn_uri: core.Provider_Callback_URL

    // If this intent handler has a name, we could use it
    name?: string;

    // The fields identified by this differ, their path and value.
    diff_fields: Map<core.SFS, any>;

    // Actually invokes the intentful function
    invoke(): any;
}
// Diff-interface ends here
// /src/intentful_core/differ_interface.ts:1 ends here
