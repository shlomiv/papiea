import * as core from "../core";
import {Status_DB} from "./status_db_interface";
import {Db,Collection} from "mongodb";

export class Status_DB_Mongo implements Status_DB {
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

    update_status(entity_ref:core.Entity_Reference, status:core.Status, cb: (err?: Error) => void):void {
        this.collection.updateOne({
            "metadata.uuid": entity_ref.uuid,
            "metadata.kind": entity_ref.kind
        }, {
            $set: {
                "status": status
            }
        }, {
            upsert: true
        }, (err, result) => {
            if (err)
                return cb(err);
            if (result.result.n !== 1)
                return cb(new Error("Amount of updated entries doesn't equal to 1: " + result.result.n));
            cb();
        });
    }

    get_status(entity_ref:core.Entity_Reference, cb: (err: Error|null, entity_metadata?: core.Metadata, status?: core.Status) => void):void {
        this.collection.findOne({
            "metadata.uuid": entity_ref.uuid,
            "metadata.kind": entity_ref.kind
        }, (err, result) => {
            if (err)
                return cb(err);
            if (result === null)
                return cb(new Error("Not found"));
            cb(null, result.metadata, result.status);
        });
    }

    list_status(fields_map: any, cb: (err: Error|null, res?:[core.Metadata, core.Status][]) => void):void {
        this.collection.find(fields_map).toArray((err, result) => {
            if (err)
                return cb(err);
            if (result === null)
                return cb(null, []);
            const res:[core.Metadata, core.Status][] = result.map((x:any):[core.Metadata, core.Status] => [x.metadata, x.status]);
            cb(null, res);
        });
    }
}