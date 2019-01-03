// [[file:~/work/papiea-js/Papiea-design.org::*/src/core.ts][/src/core.ts:1]]
// This should probably be imported from some library
export type uuid4 = string;

// [[file:~/work/papiea-js/Papiea-design.org::#h-Coretypes-732][core-types]]
// Calback url is just a string
export type Provider_Callback_URL = string;

// Store a struct description parsed from Swagger Model YAML
export type Data_Description = any;

// Lets define a type for a version. For now it may be string, but could be more
// elaborate later on
export type Version = number;
// core-types ends here

// [[file:~/work/papiea-js/Papiea-design.org::#h-Metadata-350][metadata-struct]]
export interface Metadata {
    // Identity fields
    uuid: uuid4;
    kind: string;
    spec_version: number;

    // Additional fields
    created_at: Date;
    deleted_at?: Date;
}
// metadata-struct ends here

// [[file:~/work/papiea-js/Papiea-design.org::#h-Spec-715][spec-struct]]
export type Spec = any;
// spec-struct ends here

// [[file:~/work/papiea-js/Papiea-design.org::#h-Status-990][status-struct]]
export type Status = any;
// status-struct ends here

// [[file:~/work/papiea-js/Papiea-design.org::#h-Entity-43][entity-struct]]
export interface Entity {
  metadata: Metadata;
  spec: Spec;
  status: Status
}
// entity-struct ends here

// [[file:~/work/papiea-js/Papiea-design.org::#h-Interfaces-559][SFS-interfaces]]
// Intentful signature
export type SFS = string;

export interface Intentful_Signature {
    signature: SFS;
    compiled_signature: any
    function_callback: Provider_Callback_URL;
}
// SFS-interfaces ends here

// [[file:~/work/papiea-js/Papiea-design.org::#h-Entity-Reference-396][entity-reference-struct]]
export interface Entity_Reference  {
    uuid: uuid4;
    kind: string;

    // This field is optional and is only used help the user identify
    // what this reference is pointing to. 
    name?: string;
}
// entity-reference-struct ends here
// /src/core.ts:1 ends here
