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

    update_spec(entity_metadata: core.Metadata, spec:core.Spec, cb: (res: boolean, entity_metadata?: core.Metadata, spec?: core.Spec) => void):void {
        var entity_metadata_update = Object.assign({}, entity_metadata);
        entity_metadata_update.spec_version++;
        this.collection.updateOne({
            "metadata.uuid": entity_metadata.uuid,
            "metadata.spec_version": entity_metadata.spec_version
        }, {
            $set: {
                "metadata": entity_metadata_update,
                "spec": spec
            }
        }, {
            upsert: true
        }, (err, result) => {
            if (err || result.result.n !== 1)
                return cb(false);
            entity_metadata.spec_version++;
            cb(true, entity_metadata, spec);
        });
    }

    get_spec(entity_ref: core.Entity_Reference, cb: (err: Error|null, entity_metadata?: core.Metadata, spec?: core.Spec) => void):void {
        this.collection.findOne({
            "metadata.uuid": entity_ref.uuid
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