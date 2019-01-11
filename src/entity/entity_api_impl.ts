import axios from "axios"
import { Status_DB } from "../databases/status_db_interface";
import { Spec_DB } from "../databases/spec_db_interface";
import { Provider_DB } from "../databases/provider_db_interface";
import { Kind, Procedural_Signature } from "../papiea";
import { Entity_Reference, Metadata, Spec, uuid4 } from "../core";
import uuid = require("uuid");
import { EntityApiInterface } from "./entity_api_interface";

export class EntityAPI implements EntityApiInterface {
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
        found_kind.procedures = new Map(found_kind.procedures);
        return found_kind;
    }

    async save_entity(kind: Kind, spec_description: Spec): Promise<[Metadata, Spec]> {
        const metadata: Metadata = { uuid: uuid(), spec_version: 0, created_at: new Date(), kind: kind.name };
        //TODO: kind.validator_fn(entity)
        return this.spec_db.update_spec(metadata, spec_description)
    }

    async get_entity_spec(kind: Kind, entity_uuid: uuid4): Promise<[Metadata, Spec]> {
        const entity_ref: Entity_Reference = { kind: kind.name, uuid: entity_uuid };
        return this.spec_db.get_spec(entity_ref);
    }

    async filter_entity_spec(kind: Kind, fields: any): Promise<[Metadata, Spec][]> {
        fields["metadata.kind"] = kind.name;
        return this.spec_db.list_specs(fields);
    }

    async update_entity_spec(uuid: uuid4, spec_version: number, kind: Kind, spec_description: Spec): Promise<[Metadata, Spec]> {
        const metadata: Metadata = { uuid: uuid, kind: kind.name, spec_version: spec_version } as Metadata;
        return this.spec_db.update_spec(metadata, spec_description);
    }

    async delete_entity_spec(kind: Kind, entity_uuid: uuid4): Promise<void> {
        const entity_ref: Entity_Reference = { kind: kind.name, uuid: entity_uuid };
        await this.spec_db.delete_spec(entity_ref);
        await this.status_db.delete_status(entity_ref);
    }

    async call_procedure(kind: Kind, entity_uuid: uuid4, procedure_name: string, input: any): Promise<any> {
        const entity_data: [Metadata, Spec] = await this.get_entity_spec(kind, entity_uuid);
        const procedure: Procedural_Signature | undefined = kind.procedures.get(procedure_name);
        if (procedure === undefined) {
            throw new Error(`Procedure ${procedure_name} not found for kind ${kind.name}`);
        }
        const providerApi = axios.create({
            baseURL: procedure.procedure_callback,
            timeout: 1000,
            headers: { 'Content-Type': 'application/json' }
        });
        const { data } = await providerApi.post('/', {
            metadata: entity_data[0],
            spec: entity_data[1],
            input: input
        });
        return data;
    }
}