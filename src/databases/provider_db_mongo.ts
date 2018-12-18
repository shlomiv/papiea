import {Provider_DB} from "./provider_db_interface";
import {Kind, Provider} from "../papiea";
import {Db, Collection} from "mongodb"
import {uuid4, Version} from "../core";

export default class ProviderDbMongo implements Provider_DB {
    collection: Collection;

    constructor(db: Db) {
        this.collection = db.collection("provider")
    }

    //TODO: register in intent engine
    register_provider(provider: Provider): void {

    }

    async init(): Promise<void> {
        try {
            await this.collection.createIndex({
                "uuid": 1
            }, {name: "uuid", unique: true})
        } catch (err) {
            throw err;
        }
    }

    async inset_provider(uuid: string, provider_prefix: string, version: Version, kinds: Kind[]): Promise<boolean> {
        const result = await this.collection.insertOne({uuid, provider_prefix, version, kinds});
        return result.result.ok === 1;
    }

    async get_provider(provider_prefix: string, version?: Version): Promise<Provider> {
        if (version === null) {
            const provider: Provider | null = await this.collection.findOne({provider_prefix});
            if (provider == null) {
                throw new Error(`Provider with prefix ${provider_prefix} not found`)
            } else {
                return provider
            }
        } else {
            const provider: Provider | null = await this.collection.findOne({provider_prefix, version});
            if (provider == null) {
                throw new Error(`Provider with prefix ${provider_prefix} not found`)
            } else {
                return provider
            }
        }

    }

    async list_providers(): Promise<Provider[]> {
        return await this.collection.find({}).toArray()
    }

    //TODO: deregister from intent engine
    async delete_provider(provider_uuid: uuid4): Promise<boolean> {
        const result = await this.collection.deleteOne({"uuid": provider_uuid});
        if (result.result.n !== 1) {
            throw new Error("Amount of entities deleted is not 1")
        }
        return result.result.ok == 1;
    }
}