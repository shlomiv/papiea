// [[file:~/work/papiea-js/Papiea-design.org::*/src/papiea.ts][/src/papiea.ts:1]]
import * as core from "./core"
import * as differ from "./intentful_core/differ_interface"
import * as spec from "./databases/spec_db_interface"
import * as status from "./databases/status_db_interface"
import * as provider from "./databases/provider_db_interface"

// [[file:~/work/papiea-js/Papiea-design.org::#h-Kind-241][kind-struct]]
export interface Kind {

    // The name of the kind, and its plural form for proper REST naming
    name: string;
    name_plural: string;

    //// Entity structure
    kind_structure: core.Data_Description;
    validator_fn: (entity:core.Entity)=>boolean;
    semantic_validator_fn?: core.Provider_Callback_URL; 

    //// Intentful behavior
    intentful_signatures: core.Map<core.SFS, core.Intentful_Signature>;

    // Every sfs lists the sfs's it has to execute before
    dependency_tree: core.Map<core.SFS, core.SFS[]>;

    // The compiled Differ
    differ: differ.Differ;

    //// Procedural behavior
    procedures: core.Map<string, Procedural_Signature>;
}
// kind-struct ends here

// [[file:~/work/papiea-js/Papiea-design.org::#h-Interface-598][procedure-signature]]
// We may want to support different execution strategies. For now we
// can only halt intentful execution for the duration of the
// procedural call
export enum Procedural_Execution_Strategy {Halt_Intentful};

export interface Procedural_Signature {
    // The name of the procedure to be exported by the engine.
    name: string;

    // The representation of the data to be passed to this procedure
    argument: core.Data_Description;

    // The automatically generated validator
    arg_validator_fn: (arg:any)=>boolean;

    // The representation of the data to be returned from this procedure
    result: core.Data_Description;

    // The automatically generated validator
    result_validator_fn: (res:any)=>boolean;

    // Does the engine pauses all intentful operation invocations for
    // the duration of the procedural call
    execution_strategy: Procedural_Execution_Strategy;

    // Action url into the provider
    procedure_callback: core.Provider_Callback_URL;
}

// procedure-signature ends here

// [[file:~/work/papiea-js/Papiea-design.org::#h-Provider-description-189][provider-desc-struct]]
export interface Provider {
    // A unique identifier where all kinds will be under this prefix
    prefix: string;
    version: core.Version;
    kinds: Kind[]
}
// provider-desc-struct ends here

// [[file:~/work/papiea-js/Papiea-design.org::#h-Interface-680][papiea-interface]]
export interface Papiea {

    // api is the mechanism which adds REST endpoints to Papiea.
    api: any; // For now, this will be the type of the API router
    prefix: string;

    statusDb: status.Status_DB;
    specsDb: spec.Spec_DB;
    providersDb: provider.Provider_DB;
} 
// papiea-interface ends here
// /src/papiea.ts:1 ends here
