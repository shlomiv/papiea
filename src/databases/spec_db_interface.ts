// [[file:~/work/papiea-js/Papiea-design.org::*/src/databases/spec_db_interface.ts][/src/databases/spec_db_interface.ts:1]]
import * as core from "../core";
import * as papiea from "../papiea";

// [[file:~/work/papiea-js/Papiea-design.org::#h-Interface-229][spec-db-interface]]

export interface Spec_DB {

    // Tries to update the spec. Succeeds only if the spec_version
    // field in metadata is currently equals to the one on record. The
    // implementation needs to CAS the spec_version to the increment
    // of itself, and return the new metadata with the new
    // spec_version and the new CASed in spec.
    update_spec(entity_metadata: core.Metadata, spec:core.Spec): Promise<[core.Metadata?, core.Spec?, Error?]>;

    // Get the spec of a particular entity from the db. Returns both
    // current metadata and the spec of that entity.
    get_spec(entity_ref: core.Entity_Reference): Promise<[core.Metadata?, core.Spec?]>;

    // List all specs that have their fields match the ones given in
    // fields_map. E.g. we could look for all specs for `vm` kind that
    // have a certain ip:
    // list_specs({"metadata": {"kind": "vm"},
    //             "spec":     {"ip":   "10.0.0.10"}})
    //
    // We could come up with command such as greater-than etc at some
    // later point, or we could use a similar dsl to mongodb search
    // dsl.
    list_specs(fields_map: any): Promise<[core.Metadata?, core.Spec?][]>;
}

// spec-db-interface ends here
// /src/databases/spec_db_interface.ts:1 ends here
