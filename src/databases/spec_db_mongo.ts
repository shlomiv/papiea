import * as core from "../core";
import {Spec_DB} from "./spec_db_interface";
import {Db,Collection} from "mongodb";

export class Spec_DB_Mongo implements Spec_DB {
    collection:Collection;
    constructor(db: Db) {
        this.collection = db.collection("spec");
    }

    update_spec(entity_metadata: core.Metadata, spec:core.Spec):[boolean, core.Metadata, core.Spec] {
        return [true, entity_metadata, spec];
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