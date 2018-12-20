import {Provider_DB} from "./provider_db_interface";
import {Provider} from "../papiea";
import {Db, Collection} from "mongodb"
import {Version} from "../core";

export class Provider_DB_Mongo implements Provider_DB {
    collection: Collection;

    constructor(db: Db) {
        this.collection = db.collection("provider");
    }

    async init(): Promise<void> {
        try {
            await this.collection.createIndex({
                "prefix": 1
            }, {name: "prefix", unique: true});
        } catch (err) {
            throw err;
        }
    }

    async register_provider(provider: Provider): Promise<void> {
        const result = await this.collection.updateOne({
            "prefix": provider.prefix,
            "version": provider.version
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
        const filter: any = {prefix: provider_prefix};
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

    async delete_provider(provider_prefix: string, version: Version): Promise<boolean> {
        const result = await this.collection.deleteOne({"prefix": provider_prefix, version});
        if (result.result.n !== 1) {
            throw new Error("Amount of entities deleted is not 1");
        }
        return result.result.ok == 1;
    }
}