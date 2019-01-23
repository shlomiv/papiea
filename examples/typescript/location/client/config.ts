const papiea_config = {
    core: {
        host: "127.0.0.1",
        port: 3000
    }
};

export const provider_config = {
    prefix: "location_provider",
    kind_name: "Location",
    entity_url: `http://${papiea_config.core.host}:${papiea_config.core.port}/entity`,
    procedure_name: "moveX"
};

export const location_entity_config = {
    entity: {
        initial_spec: {
            x: 10,
            y: 20
        },
        update_spec: {
            x: 100,
            y: 200
        },
        procedure_input: 5
    },
};