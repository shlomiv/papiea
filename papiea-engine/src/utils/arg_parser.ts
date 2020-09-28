import * as fs from "fs"

const PAPIEA_CONFIG_PATH = process.env.PAPIEA_CONFIG_PATH ?? "../../papiea-config.json"

export interface PapieaConfig {
    [key: string]: string | number | boolean

    // Server port
    server_port: number,

    // Public facing papiea address
    public_addr: string,

    // Mongo url
    mongo_url: string,

    // Mongo Db collection name to store papiea entities in
    mongo_db: string,

    // Papiea Admin S2S key
    admin_key: string,

    // Papiea debug mode toggle
    debug: boolean,

    // Default logging level for papiea
    logging_level: string,

    // Size of batch of random entities to be added to diff resolution each N seconds
    entity_batch_size: number,

    // Deleted watcher persists in database for this amount of seconds
    deleted_watcher_persist_time: number
}

const TRANSFORM_FN_MAP: { [key: string]: Function } = {
    server_port: Number.parseInt,
    entity_batch_size: Number.parseInt,
    deleted_watcher_persist_time: Number.parseInt,
    debug: (val: string) => val === "true"
}

const PAPIEA_DEFAULT_CFG: PapieaConfig = {
    server_port: 3000,
    public_addr: "http://localhost:3000",
    mongo_url: "mongodb://mongo:27017",
    mongo_db: "papiea",
    admin_key: "",
    debug: true,
    logging_level: "info",
    entity_batch_size: 5,
    deleted_watcher_persist_time: 100
}

export function getConfig(): PapieaConfig {
    const config: PapieaConfig = JSON.parse(fs.readFileSync(PAPIEA_CONFIG_PATH, 'utf-8'))
    const mapConfigToEnv: { [key: string]: string } = {}
    Object.assign(mapConfigToEnv, config)
    for (let key in mapConfigToEnv) {
        mapConfigToEnv[key] = `PAPIEA_${key.toUpperCase()}`
    }
    // If there is an env variable prefixed with PAPIEA_ and has the same name
    // as the config parameter - override config param with an env variable
    for (let key in config) {
        if (!config.hasOwnProperty(key)) {
            continue
        }
        if (process.env[mapConfigToEnv[key]] !== undefined) {
            const transformFn = TRANSFORM_FN_MAP[key]
            if (transformFn !== undefined) {
                config[key] = transformFn(process.env[mapConfigToEnv[key]]!)
            } else {
                config[key] = process.env[mapConfigToEnv[key]]!
            }
        }
    }

    // Merge with default to populate undefined values
    const mergedConfig = {}
    Object.assign(mergedConfig, PAPIEA_DEFAULT_CFG)
    Object.assign(mergedConfig, config)
    return mergedConfig as PapieaConfig
}
