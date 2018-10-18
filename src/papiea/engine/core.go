// All our structs and interfaces:

// Untyped json for now. We should probably use some better library for that:
type untypedJson map[string]interface{}

// Spec, status and metadata:
type spec untypedJson
type status untypedJson
type metadata struct {
    // Identity fields
    uuid uuid
    kind string
    specVersion int

    // Additional fields
    created_at timestamp
    delete_at timestamp
}

// Kind and providers:
type kind struct {
    name string
    entityStructure untypedJson
}
type providerDescription struct {
    uuid uuid
    version int
    uri string
    kinds []kind
}

// Define our database interfaces:

type specDb interface {
    // AtomicSpecChange guarantees that changing the spec will be done
    // atomically. It could be implemented in terms of locks or CAS
    AtomicSpecChange(entityReference, status) task, err
    getLatestSpec(entityReference) metadata, spec, err
}
type providersDb interface {

    // Register a new provider with the intent engine
    addProvider(providerDescription) err

    // TODO: I am debating if to keep the =from= argument a
    // providerDescription which contains the uuid or to only get a
    // uuid.
    // Upgrade a provider
    upgradeProvider(from providerDescription, to providerDescription) err

    listProviders() []providerDescription

    // Removes and de-registers a provider from the intent engine
    deleteProvider(providerUuid) err
}

// Services interfaces:
type task interface {
    newTask(entityReference, spec) task
    // TODO: More will be added
}

// Provider APIs signatures.
// Status Fields Signatures:
type sfsSignature struct {
    signature string
    parsedSignatureAst ...
}

// Procedure Signatures:
type procedureSignature struct {
    signature string
    parsedSignatureAst ...
}

// Provider handlers:
type provider_callbacks interface {
    registerIntentfulCallback(sig sfsSignature, callbackUrl string) err
    registerProceduralCallback(sig procedureSignature, callbackUrl string) err
}

// Papiea:
type papiea struct {
    api rest.api
    statusDb
    specDb
    providersDb
}

type papieaInit interface {
    initialize() papiea, err
}
