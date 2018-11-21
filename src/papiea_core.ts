interface metadata {
    kind: string;
    uuid: string;
    spec_version: number;
}

interface spec{}

interface status{}

interface entity{
    metadata:metadata;
    spec:spec;
    status:status;
}

type data_description = any;

type provider_callback = string;

interface intentful_signature {
    signature: string;
    AST: any;
    function_callback: provider_callback;
}

interface procedural_signature {
    // The name of the procedure to be exported by the engine.
    name: string;

    // The representation of the data to be passed to this procedure
    argument: data_description;

    // Does the engine pauses all intentful operation invocations for
    // the duration of the procedural call
    pause_intentfulness: boolean;
}

interface test {
    test(a:number):[string, boolean];
}

interface provider_kind {
    // The kind this provider handles.
    kind: string;

    // The various signatures a provider may handle.
    intentful_signatures: intentful_signature[];
    procedural_signatures: procedural_signature[];

    // This will represent the dependency tree which gives precedence
    // to the various functions
    intentful_dep_tree: any;
    
    // A json or yaml that describes an entity.
    entity_description: data_description;
}

interface provider {
    // A single provider may handle multiple kinds.
    kinds: provider_kind[];
}

interface SpecDB {
    // Tries to update the spec. Succeeds only if the spec_version
    // field in metadata is currently equals to the one on record. The
    // implementation needs to CAS the spec_version to the increment
    // of itself, and return the new metadata with the new
    // spec_version and the new CASed in spec.
    update_spec(meta:metadata, spec:spec):[boolean, metadata, spec];

    // Get the spec of a particular entity from the db. Returns both
    // current metadata and the spec of that entity.
    get_spec(meta:metadata):[metadata, spec];

    // List all specs that have their fields match the ones given in
    // fields_map. E.g. we could look for all specs for `vm` kind that
    // have a certain ip:
    // list_specs({"metadata": {"kind": "vm"},
    //             "spec":     {"ip":   "10.0.0.10"}})
    //
    // We could come up with command such as greater-than etc at some
    // later point, or we could use a similar dsl to mongodb search
    // dsl.
    list_specs(fields_map: any): [metadata, spec][];
}

interface StatusDB{
    // Update the status in the status db. As long as the input is
    // correct this always succeeds.
    update_status(meta:metadata, status:status):boolean;

    // Gets the status of a particular entity from the db. Returns
    // both current metadata and status of the entity.
    get_status(meta:metadata):[metadata, status];

    // List all status that have their fields match the ones given in
    // fields_map. E.g. we could look for all specs for `vm` kind that
    // have a certain ip:
    // list_specs({"metadata": {"kind": "vm"},
    //             "status":   {"ip":   "10.0.0.10"}})
    //
    // We could come up with command such as greater-than etc at some
    // later point, or we could use a similar dsl to mongodb search
    // dsl.
    list_specs(fields_map: any): [metadata, status][];
}

enum DifferResults {
    All = 0,
    First = 1
}

interface Differ {
    // A constructor which creates a differ out of a kind specification
    build_differ(kind: provider_kind):Differ;

    // Applies an entity on the Differ. Can get `All results`, just
    // the first, or top-k results. Returns an array of callbacks
    apply_diff(entity: entity, results:DifferResults|number): provider_callback[];

    // The actual differ structure
    differ_internals: any;
}

interface Task {
    task_url: string;
    create_task(metadata:metadata, spec:spec): Task;
    update_task(task:Task):Task;
}
