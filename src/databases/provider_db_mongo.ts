import {Provider_DB} from "./provider_db_interface";
import {Kind, Provider} from "../papiea";
import {Db, Collection} from "mongodb"
import {uuid4, Version} from "../core";

export class Provider_DB_Mongo implements Provider_DB {
    collection: Collection;

    constructor(db: Db) {
        this.collection = db.collection("provider");
    }

    async init(): Promise<void> {
        try {
            await this.collection.createIndex({
                "uuid": 1
            }, {name: "provider_uuid", unique: true});
        } catch (err) {
            throw err;
        }
    }

    async register_provider(provider: Provider): Promise<void> {
        const result = await this.collection.updateOne({
            "uuid": provider.uuid
        }, {
            $set: provider
        }, {
            upsert: true
        });
        if (result.result.n !== 1) {
            throw new Error(`Amount of updated entries doesn't equal to 1: ${result.result.n}`)
        }
    }
    
    async get_provider(provider_prefix: string, version?: Version): Promise<Provider> {
        var filter:any = {prefix: provider_prefix};
        if (version !== null) {
            filter.version = version;
        }
        const provider: Provider | null = await this.collection.findOne(filter);
        if (provider == null) {
            throw new Error(`Provider with prefix ${provider_prefix} not found`);
        } else {
            return provider;
        }
    }

    async list_providers(): Promise<Provider[]> {
        return await this.collection.find({}).toArray();
    }

    async delete_provider(provider_uuid: uuid4): Promise<boolean> {
        const result = await this.collection.deleteOne({"uuid": provider_uuid});
        if (result.result.n !== 1) {
            throw new Error("Amount of entities deleted is not 1");
        }
        return result.result.ok == 1;
    }
}