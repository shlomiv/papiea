import * as differ from "./differ_interface"
import * as core from "../core";
import * as papiea from "../papiea";


export class Compiler implements differ.Kind_Compiler {
    public compile_kind_explicit(sfss: core.SFS[], dep_tree: Map<core.SFS, core.SFS[]>): TheDiffer {
        return new TheDiffer();
    }

    // More concisely this could simply be:
    public compile_kind(kind: papiea.Kind): TheDiffer {
        return new TheDiffer();
    }
}

export let compiler = new Compiler();

export class TheDiffer implements differ.Differ  {
    // Get the next diff from an entity based on the 
    public next_diff(entity:core.Entity_Reference, spec: core.Spec, status: core.Status):TheDiff {
        return new TheDiff("test", new Map(), "name");
    }

    // We could also get the entire list of diffs, ordered by the
    // original dependency tree
    public all_diffs(entity:core.Entity_Reference, spec: core.Spec, status: core.Status):TheDiff[] {
        return [new TheDiff("testall", new Map(), "nameall")];
    }
}

export class TheDiff implements differ.Diff {

    // The uri exposed by the provider which may handle this diff
    intentful_fn_uri: core.Provider_Callback_URL

    // If this intent handler has a name, we could use it
    name?: string;

    // The fields identified by this differ, their path and value.
    diff_fields: Map<core.SFS, any>;

    constructor(callback: core.Provider_Callback_URL, diff_fields: Map<core.SFS, any>, name?: string) {
        this.intentful_fn_uri = callback;
        this.name = name;
        this.diff_fields = diff_fields;
    }
    
    public invoke() {
        return "Yes!";
    }
}
