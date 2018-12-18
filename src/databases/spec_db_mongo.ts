import * as core from "../core";
import {Spec_DB} from "./spec_db_interface";
import {Db,Collection} from "mongodb";

export class Spec_DB_Mongo implements Spec_DB {
    collection:Collection;
    constructor(db: Db) {
        this.collection = db.collection("entity");
    }

    init(cb: (error?:Error) => void):void {
        this.collection.createIndex(
            { "metadata.uuid": 1 },
            { name: "entity_uuid", unique: true },
            (err, result) => {
                cb(err);
            }
        );
    }

    update_spec(entity_metadata: core.Metadata, spec:core.Spec, cb: (err: Error|null, entity_metadata?: core.Metadata, spec?: core.Spec) => void):void {
        this.collection.updateOne({
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
        }, (err, result) => {
            if (err && err.code === 11000) {
                // E11000 duplicate key error collection: papiea.entity index: entity_uuid dup key
                // means Entity with conflicting spec_version exists
                const entity_ref:core.Entity_Reference = {uuid: entity_metadata.uuid, kind: entity_metadata.kind};
                return this.get_spec(entity_ref, (error, entity_metadata, spec) => {
                    if (error)
                        return cb(error);
                    cb(err, entity_metadata, spec);
                });
            }
            if (err)
                return cb(err);
            if (result.result.n !== 1)
                return cb(new Error("Amount of updated entries doesn't equal to 1: " + result.result.n));
            entity_metadata.spec_version++;
            cb(null, entity_metadata, spec);
        });
    }

    get_spec(entity_ref: core.Entity_Reference, cb: (err: Error|null, entity_metadata?: core.Metadata, spec?: core.Spec) => void):void {
        this.collection.findOne({
            "metadata.uuid": entity_ref.uuid,
            "metadata.kind": entity_ref.kind
        }, (err, result) => {
            if (err)
                return cb(err);
            if (result === null)
                return cb(new Error("Not found"));
            cb(null, result.metadata, result.spec);
        });
    }

    list_specs(fields_map: any, cb: (err: Error|null, res?:[core.Metadata, core.Spec][]) => void):void {
        this.collection.find(fields_map).toArray((err, result) => {
            if (err)
                return cb(err);
            if (result === null)
                return cb(null, []);
            const res:[core.Metadata, core.Spec][] = result.map((x:any):[core.Metadata, core.Spec] => [x.metadata, x.spec]);
            cb(null, res);
        });
    }
}