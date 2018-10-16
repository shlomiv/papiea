// all our structs and interfaces

// Define our structs and types

// Untyped json for now. We should probably use some better library for that
type untyped_json map[string]interface{}

// Spec, status and metadata
type spec untyped_json
type status untyped_json
type metadata struct {
    uuid uuid
    kind string
    spec_version int
}

// Kind and providers
type kind struct {
    name string
    entity_structure untyped_json
}
type provider_description struct {
    uuid uuid
    version int
    uri string
    kinds []kind
}

// Define our database interfaces

type spec_db interface {
    cas_spec_change(metadata, status) task, err
    get_latest_spec(metadata) metadata, spec, err
    cleanup() err
}
type providers_db interface {
    add_provider(provider_description) err
    upgrade_provider(from provider_description, to provider_description) err
    list_providers() []provider_description
    delete_provider(provider_uuid) err
}

// Services interfaces
type task interface {
    new_task(metadata) task
}

// Papiea
type papiea struct {
    api rest.api
    status_db
    spec_db
    providers_db
}

type papiea-init interface {
    initialize() papiea, err
}
