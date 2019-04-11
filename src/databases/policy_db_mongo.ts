import { Policy_DB } from "./policy_db_interface";
import { Db, Collection } from "mongodb";

export class Policy_DB_Mongo implements Policy_DB {
    collection: Collection;

    constructor(db: Db) {
        this.collection = db.collection("policy");
    }

    async init(): Promise<void> {
        try {
            await this.collection.createIndex({
                "provider_prefix": 1
            }, { unique: true });
        } catch (err) {
            throw err;
        }
    }

    async load_policy(provider_prefix: string): Promise<string> {
        const result: any | null = await this.collection.findOne({
            "provider_prefix": provider_prefix
        });
        if (result === null) {
            return "";
        }
        return result.policy;
    }

    async save_policy(provider_prefix: string, policy: string): Promise<void> {
        const result = await this.collection.updateOne({
            "provider_prefix": provider_prefix
        }, {
                $set: {
                    "provider_prefix": provider_prefix,
                    "policy": policy
                }
            }, {
                upsert: true
            });
        if (result.result.n !== 1) {
            throw new Error(`Amount of updated entries doesn't equal to 1: ${result.result.n}`);
        }
    }
}