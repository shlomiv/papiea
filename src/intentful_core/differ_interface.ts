// [[file:~/work/papiea-js/Papiea-design.org::*/src/intentful_core/differ_interface.ts][/src/intentful_core/differ_interface.ts:1]]
// [[file:~/work/papiea-js/Papiea-design.org::Differ-interface][Differ-interface]]

// The sfss compiler function. 
function compile_kind(sfss: sfs[], dep_tree: map<sfs, sfs[]>): Differ;

// More concisely this could simply be:
function compile_kind(kind: Provider_Kind): Differ;

// The differ is used to locate a diff in an entity between the
// current status and the desired state. 
interface Differ {

    // Get the next diff from an entity based on the 
    next_diff(entity:Entity_Reference, spec: Spec, status: Status):Diff;

    // We could also get the entire list of diffs, ordered by the
    // original dependency tree
    all_diffs(entity:Entity_Reference, spec: Spec, status: Status):Diff[];
}
// Differ-interface ends here

// [[file:~/work/papiea-js/Papiea-design.org::Diff-interface][Diff-interface]]
// The Diff structure captures a discovered diff in an entity as well
// as the intentful action that may resolve such diff
interface Diff {
    // The uri exposed by the provider which may handle this diff
    intentful_fn_uri: provider_callback_url

    // If this intent handler has a name, we could use it
    name?: string;

    // The fields identified by this differ, their path and value.
    diff_fields: map<sfs, any>;

    // Actually invokes the intentful function
    invoke(): Response;
}
// Diff-interface ends here
// /src/intentful_core/differ_interface.ts:1 ends here
