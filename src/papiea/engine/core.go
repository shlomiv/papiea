// all our structs and interfaces

// Define our structs and types

// Untyped json for now. We should probably use some better library for that
type untypedJson map[string]interface{}

// Spec, status and metadata
type spec untypedJson
type status untypedJson
type metadata struct {
    uuid uuid
    kind string
    specVersion int
}

// Kind and providers
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

// Define our database interfaces

type specDb interface {
    casSpecChange(metadata, status) task, err
    getLatestSpec(metadata) metadata, spec, err
    cleanup() err
}
type providersDb interface {
    addProvider(providerDescription) err
    upgradeProvider(from providerDescription, to providerDescription) err
    listProvider() []providerDescription
    deleteProvider(providerUuid) err
}

// Services interfaces
type task interface {
    newTask(metadata) task
}

// Provider APIs signatures
// Status Fields Signatures
type sfsSignature struct {
    signature string
    parsedSignatureAst ...
}

// Procedure Signatures
type procedureSignature struct {
    signature string
    parsedSignatureAst ...
}

// Provider handlers
type provider_callbacks interface {
    registerIntentfulCallback(sig sfsSignature, callbackUrl string) err
    registerProceduralCallback(sig procedureSignature, callbackUrl string) err
}

// Papiea
type papiea struct {
    api rest.api
    statusDb
    specDb
    providersDb
}

type papieaInit interface {
    initialize() papiea, err
}
