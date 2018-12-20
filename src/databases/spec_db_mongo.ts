import * as core from "../core";
import {Entity} from "../core";
import {Spec_DB} from "./spec_db_interface";
import {Collection, Db} from "mongodb";
import {ConflictingEntityError} from "./utils/errors";

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

    async update_spec(entity_metadata: core.Metadata, spec: core.Spec): Promise<[core.Metadata | null, core.Spec | null]> {
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
                if (metadata && spec)
                    throw new ConflictingEntityError("Spec with this version already exists", metadata, spec);
                else
                    throw new Error("Spec with this version already exists but no metadata or spec is found")
            } else {
                throw err;
            }
        }
    }

    async get_spec(entity_ref: core.Entity_Reference): Promise<[core.Metadata | null, core.Spec | null]> {
        const result: Entity | null = await this.collection.findOne({
            "metadata.uuid": entity_ref.uuid,
            "metadata.kind": entity_ref.kind
        });
        if (result === null) {
            throw new Error("Entity not found")
        }
        return [result.metadata, result.spec];
    }

    async list_specs(fields_map: any): Promise<[core.Metadata | null, core.Spec | null][]> {
        const result = await this.collection.find(fields_map).toArray();
        return result.map((x: any): [core.Metadata, core.Spec] => [x.metadata, x.spec]);
    }
}