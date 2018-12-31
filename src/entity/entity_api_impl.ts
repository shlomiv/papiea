import {Status_DB} from "../databases/status_db_interface";
import {Spec_DB} from "../databases/spec_db_interface";
import {Provider_DB} from "../databases/provider_db_interface";
import {Kind} from "../papiea";
import {Entity, Entity_Reference, Metadata, Spec, Status, uuid4} from "../core";
import uuid = require("uuid");
import {IEntityAPI} from "./entity_api_interface";

export class EntityAPI implements IEntityAPI {
    private status_db: Status_DB;
    private spec_db: Spec_DB;
    private provider_db: Provider_DB;

    constructor(status_db: Status_DB, spec_db: Spec_DB, provider_db: Provider_DB) {
        this.status_db = status_db;
        this.spec_db = spec_db;
        this.provider_db = provider_db;
    }

    async get_kind(prefix: string, kind: string): Promise<Kind> {
        const provider = await this.provider_db.get_provider(prefix);
        const found_kind: Kind | undefined = provider.kinds.find(elem => elem.name === kind);
        if (found_kind === undefined) {
            throw new Error(`Kind: ${kind} not found on the provider with prefix: ${prefix}`)
        }
        return found_kind;
    }

    async save_entity(kind: Kind, spec_description: any, status_description?: any): Promise<[Metadata, Spec]> {
        const metadata: Metadata = {uuid: uuid(), spec_version: 0.1, created_at: new Date(), kind: kind.name};
        const entity: Entity = {metadata, spec: spec_description, status: status_description};
        //TODO: kind.validator_fn(entity)
        if (status_description) {
            await this.status_db.update_status(metadata, entity.status);
            return await this.spec_db.update_spec(metadata, entity.spec);
        } else {
            return this.spec_db.update_spec(metadata, entity.spec)
        }
    }

    async get_entity_spec(kind: Kind, entity_uuid: uuid4): Promise<[Metadata, Spec]> {
        const entity_ref: Entity_Reference = {kind: kind.name, uuid: entity_uuid};
        return this.spec_db.get_spec(entity_ref);
    }

    async filter_entity_spec(kind: Kind, fields: any): Promise<[Metadata, Spec][]> {
        fields.kind = kind;
        return this.spec_db.list_specs(fields);
    }

    async update_entity_spec(kind: Kind, spec_description: any): Promise<[Metadata, Spec]> {
        const metadata: Metadata = {uuid: uuid(), spec_version: 0.1, created_at: new Date(), kind: kind.name};
        return this.spec_db.update_spec(metadata, spec_description);
    }

    //TODO: delete entity
    delete_entity_spec(kind: Kind, entity_uuid: uuid4): Promise<boolean> {
        throw new Error("Not implemented")
    }
}