import * as core from "../core";
import { Entity } from "../core";
import { Spec_DB } from "./spec_db_interface";
import { Collection, Db } from "mongodb";
import { ConflictingEntityError } from "./utils/errors";

export class Spec_DB_Mongo implements Spec_DB {
    collection: Collection;

    constructor(db: Db) {
        this.collection = db.collection("entity");
    }

    async init(): Promise<void> {
        try {
            await this.collection.createIndex(
                {"metadata.uuid": 1},
                {name: "entity_uuid", unique: true},
            );
        } catch (err) {
            throw err
        }
    }

    async update_spec(entity_metadata: core.Metadata, spec: core.Spec): Promise<[core.Metadata, core.Spec]> {
        try {
            const result = await this.collection.updateOne({
                "metadata.uuid": entity_metadata.uuid,
                "metadata.kind": entity_metadata.kind,
                "metadata.spec_version": entity_metadata.spec_version
            }, {
                $inc: {
                    "metadata.spec_version": 1
                },
                $set: {
                    "spec": spec
                },
                $setOnInsert: {
                    "created_at": new Date()
                }
            }, {
                upsert: true
            });
            if (result.result.n !== 1) {
                throw new Error(`Amount of updated entries doesn't equal to 1: ${result.result.n}`)
            }
            entity_metadata.spec_version++;
            return [entity_metadata, spec]
        } catch (err) {
            if (err.code === 11000) {
                const entity_ref: core.Entity_Reference = {uuid: entity_metadata.uuid, kind: entity_metadata.kind};
                const [metadata, spec] = await this.get_spec(entity_ref);
                throw new ConflictingEntityError("Spec with this version already exists", metadata, spec);
            } else {
                throw err;
            }
        }
    }

    async get_spec(entity_ref: core.Entity_Reference): Promise<[core.Metadata, core.Spec]> {
        const result: Entity | null = await this.collection.findOne({
            "metadata.uuid": entity_ref.uuid,
            "metadata.kind": entity_ref.kind
        });
        if (result === null) {
            throw new Error("Entity not found")
        }
        return [result.metadata, result.spec];
    }

    async list_specs(fields_map: any): Promise<([core.Metadata, core.Spec])[]> {
        const result = await this.collection.find(fields_map).toArray();
        return result.map((x: any): [core.Metadata, core.Spec] => {
            if (x.spec !== null) {
                return [x.metadata, x.spec]
            } else {
                throw new Error("No valid entities found");
            }
        });
    }

    async delete_spec(entity_ref: core.Entity_Reference): Promise<void> {
        const result = await this.collection.deleteOne({
            "metadata.uuid": entity_ref.uuid,
            "metadata.kind": entity_ref.kind
        });
        if (result.result.n === undefined || result.result.ok !== 1) {
            throw new Error("Failed to remove spec");

        }
        if (result.result.n !== 1 && result.result.n !== 0) {
            throw new Error("Amount of entities deleted is not 1");
        }
        return;
    }
}