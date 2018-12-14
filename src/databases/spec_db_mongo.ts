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
        this.collection.update({
            "metadata.uuid": entity_metadata.uuid,
            "metadata.spec_version": entity_metadata.spec_version
        }, {
            $set: {
                "metadata.spec_version": entity_metadata.spec_version + 1,
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

    get_spec(entity_ref: core.Entity_Reference):[core.Metadata, core.Spec] {
        let entity_metadata:core.Metadata = {
            uuid: "uuid",
            kind: "kind",
            spec_version: 0,
            created_at: new Date(),
            delete_at: new Date()
        };
        let entity_spec:core.Spec = null;
        return [entity_metadata, entity_spec];
    }

    list_specs(fields_map: any): [core.Metadata, core.Spec][] {
        let entity_metadata:core.Metadata = {
            uuid: "uuid",
            kind: "kind",
            spec_version: 0,
            created_at: new Date(),
            delete_at: new Date()
        };
        let entity_spec:core.Spec = null;
        return [entity_metadata, entity_spec];
    }
}