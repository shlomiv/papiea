// [[file:~/work/papiea-js/Papiea-design.org::*/src/core.ts][/src/core.ts:1]]
// [[file:~/work/papiea-js/Papiea-design.org::metadata-struct][metadata-struct]]
interface Metadata {
    // Identity fields
    uuid: uuid4;
    kind: string;
    spec_version: number;

    // Additional fields
    created_at: timestamp;
    delete_at: timestamp;
}
// metadata-struct ends here

// [[file:~/work/papiea-js/Papiea-design.org::spec-struct][spec-struct]]
type Spec = any;
// spec-struct ends here

// [[file:~/work/papiea-js/Papiea-design.org::status-struct][status-struct]]
type Status = any;
// status-struct ends here

// [[file:~/work/papiea-js/Papiea-design.org::entity-struct][entity-struct]]
interface Entity {
  metadata: Metadata;
  spec: Spec;
  status: Status
}
// entity-struct ends here

// [[file:~/work/papiea-js/Papiea-design.org::kind-struct][kind-struct]]
// Intentful signature
type sfs: string;

type Provider_Callback_URL: string;

interface Intentful_Signature {
    signature: sfs;
    compiled_signature: any
    function_callback: Provider_Callback_URL;
}

// Store a struct description parsed from Swagger Model YAML
type Data_Description = any;

// We may want to support different execution strategies. For now we
// can only halt intentful execution for the duration of the
// procedural call
enum Procedural_Execution_Strategy {Halt_Intentful};

interface Procedural_Signature {
    // The name of the procedure to be exported by the engine.
    name: string;

    // The representation of the data to be passed to this procedure
    argument: Data_Description;

    // The automatically generated validator
    arg_validator_fn: (arg:any)=>boolean;

    // The representation of the data to be returned from this procedure
    result: Data_Description;

    // The automatically generated validator
    result_validator_fn: (res:any)=>boolean;

    // Does the engine pauses all intentful operation invocations for
    // the duration of the procedural call
    execution_strategy: Procedural_Execution_Strategy;

    // Action url into the provider
    procedure_callback: Provider_Callback_URL;
}

interface Provider_Kind {

    // The name of the kind, and its plural form for proper REST naming
    name: string;
    name_plural: string;

    //// Entity structure
    kind_structure: Data_Description;
    validator_fn: (entity:entity)=>boolean;
    semantic_validator_fn?: Provider_Callback_URL; 

    //// Intentful behavior
    intentful_signatures: map<sfs, Intentful_Signatures>;

    // Every sfs lists the sfs's it has to execute before
    dependency_tree: map<sfs, sfs[]>;

    // The compiled Differ
    differ: Differ;

    //// Procedural behavior
    procedures: map<string, Procedural_Signature>;
}
// kind-struct ends here

// [[file:~/work/papiea-js/Papiea-design.org::entity-reference-struct][entity-reference-struct]]
interface Entity_Reference  {
    uuid: uuid4;
    kind: string;

    // This field is optional and is only used help the user identify
    // what this reference is pointing to. 
    name?: string;
}
// entity-reference-struct ends here

// [[file:~/work/papiea-js/Papiea-design.org::provider-desc-struct][provider-desc-struct]]
interface Provider_Description {
    uuid: uuid4;
    version: Version;
    kinds: Provider_Kind[]
}
// provider-desc-struct ends here

// [[file:~/work/papiea-js/Papiea-design.org::papiea-interface][papiea-interface]]
interface Papiea {

    // api is the mechanism which adds REST endpoints to Papiea.
    api: route;
    prefix: string;

    statusDb: Status_DB;
    specsDb: Spec_DB;
    providersDb: Providers_DB;
} 
// papiea-interface ends here
// /src/core.ts:1 ends here
