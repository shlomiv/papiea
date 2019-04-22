import axios from "axios"
import { Status_DB } from "../databases/status_db_interface";
import { Spec_DB } from "../databases/spec_db_interface";
import { Kind, Procedural_Signature, Provider } from "../papiea";
import { Data_Description, Entity_Reference, Metadata, Spec, Status, uuid4 } from "../core";
import { Entity_API } from "./entity_api_interface";
import { ValidationError, Validator } from "../validator";
import * as uuid_validate from "uuid-validate";
import { Provider_API } from "../provider/provider_api_interface";
import uuid = require("uuid");

export class ProcedureInvocationError extends Error {
    errors: string[];
    status: number;

    constructor(errors: string[], status: number) {
        super(JSON.stringify(errors));
        Object.setPrototypeOf(this, ProcedureInvocationError.prototype);
        this.errors = errors;
        this.status = status;
    }
}

export class Entity_API_Impl implements Entity_API {
    private status_db: Status_DB;
    private spec_db: Spec_DB;
    private provider_api: Provider_API;
    private validator: Validator;

    constructor(status_db: Status_DB, spec_db: Spec_DB, provider_api: Provider_API, validator: Validator) {
        this.status_db = status_db;
        this.spec_db = spec_db;
        this.provider_api = provider_api;
        this.validator = validator;
    }

    private async get_kind(kind_name: string): Promise<Kind> {
        const provider = await this.provider_api.get_latest_provider_by_kind(kind_name);
        return this.find_kind(provider, kind_name);
    }

    private find_kind(provider: Provider, kind_name: string): Kind {
        const found_kind: Kind | undefined = provider.kinds.find(elem => elem.name === kind_name);
        if (found_kind === undefined) {
            throw new Error(`Kind: ${kind_name} not found`);
        }
        return found_kind;
    }

    private async get_provider_by_kind(kind_name: string): Promise<Provider> {
        return await this.provider_api.get_latest_provider_by_kind(kind_name);
    }

    async save_entity(kind_name: string, spec_description: Spec, request_metadata: Metadata = {} as Metadata): Promise<[Metadata, Spec]> {
        const provider = await this.get_provider_by_kind(kind_name);
        const kind = this.find_kind(provider, kind_name);
        this.validate_metadata_extension(provider.extension_structure, request_metadata);
        this.validate_spec(spec_description, kind);
        if (!request_metadata.uuid) {
            request_metadata.uuid = uuid();
        }
        if (!request_metadata.spec_version) {
            request_metadata.spec_version = 0;
        }
        if (!uuid_validate(request_metadata.uuid)) {
            throw new Error("uuid is not valid")
        }
        request_metadata.created_at = new Date();
        request_metadata.kind = kind.name;
        const [metadata, spec] = await this.spec_db.update_spec(request_metadata, spec_description);
        if (kind.kind_structure[kind.name]['x-papiea-entity'] === 'spec-only')
            await this.status_db.replace_status(request_metadata, spec_description);
        return [metadata, spec];
    }

    async get_entity_spec(kind_name: string, entity_uuid: uuid4): Promise<[Metadata, Spec]> {
        const entity_ref: Entity_Reference = { kind: kind_name, uuid: entity_uuid };
        const [metadata, spec] = await this.spec_db.get_spec(entity_ref);
        return [metadata, spec];
    }

    async get_entity_status(kind_name: string, entity_uuid: uuid4): Promise<[Metadata, Status]> {
        const entity_ref: Entity_Reference = { kind: kind_name, uuid: entity_uuid };
        const [metadata, status] = await this.status_db.get_status(entity_ref);
        return [metadata, status];
    }

    async filter_entity_spec(kind_name: string, fields: any): Promise<[Metadata, Spec][]> {
        fields.metadata.kind = kind_name;
        const res = await this.spec_db.list_specs(fields);
        return res;
    }

    async filter_entity_status(kind_name: string, fields: any): Promise<[Metadata, Status][]> {
        fields.metadata.kind = kind_name;
        const res = await this.status_db.list_status(fields);
        return res;
    }

    async update_entity_spec(uuid: uuid4, spec_version: number, kind_name: string, spec_description: Spec): Promise<[Metadata, Spec]> {
        const kind: Kind = await this.get_kind(kind_name);
        this.validate_spec(spec_description, kind);
        const metadata: Metadata = { uuid: uuid, kind: kind.name, spec_version: spec_version } as Metadata;
        const [_, spec] = await this.spec_db.update_spec(metadata, spec_description);
        if (kind.kind_structure[kind.name]['x-papiea-entity'] === 'spec-only')
            await this.status_db.replace_status(metadata, spec_description);
        return [metadata, spec];
    }

    async delete_entity_spec(kind_name: string, entity_uuid: uuid4): Promise<void> {
        const entity_ref: Entity_Reference = { kind: kind_name, uuid: entity_uuid };
        const [metadata, _] = await this.spec_db.get_spec(entity_ref);
        await this.spec_db.delete_spec(entity_ref);
        await this.status_db.delete_status(entity_ref);
    }

    async call_procedure(kind_name: string, entity_uuid: uuid4, procedure_name: string, input: any): Promise<any> {
        const kind: Kind = await this.get_kind(kind_name);
        const entity_data: [Metadata, Spec] = await this.get_entity_spec(kind_name, entity_uuid);
        const procedure: Procedural_Signature | undefined = kind.procedures[procedure_name];
        if (procedure === undefined) {
            throw new Error(`Procedure ${procedure_name} not found for kind ${kind.name}`);
        }
        const schemas: any = {};
        Object.assign(schemas, procedure.argument);
        Object.assign(schemas, procedure.result);
        this.validator.validate(input, Object.values(procedure.argument)[0], schemas);
        try {
            const { data } = await axios.post(procedure.procedure_callback, {
                metadata: entity_data[0],
                spec: entity_data[1],
                input: input
            });
            this.validator.validate(data, Object.values(procedure.result)[0], schemas);
            return data;
        } catch (err) {
            if (err instanceof ValidationError) {
                throw new ProcedureInvocationError(err.errors, 500);
            } else if (err.response) {
                throw new ProcedureInvocationError([err.response.data], err.response.status)
            } else {
                throw err;
            }
        }
    }

    async call_provider_procedure(prefix: string, procedure_name: string, input: any): Promise<any> {
        const provider = await this.provider_api.get_latest_provider(prefix);
        if (provider.procedures === undefined) {
            throw new Error(`Procedure ${procedure_name} not found for provider ${prefix}`);
        }
        const procedure: Procedural_Signature | undefined = provider.procedures[procedure_name];
        if (procedure === undefined) {
            throw new Error(`Procedure ${procedure_name} not found for provider ${prefix}`);
        }
        const schemas: any = {};
        Object.assign(schemas, procedure.argument);
        Object.assign(schemas, procedure.result);
        this.validator.validate(input, Object.values(procedure.argument)[0], schemas);
        try {
            const { data } = await axios.post(procedure.procedure_callback, {
                input: input
            });
            this.validator.validate(data, Object.values(procedure.result)[0], schemas);
            return data;
        } catch (err) {
            if (err instanceof ValidationError) {
                throw new ProcedureInvocationError(err.errors, 500);
            } else {
                throw new ProcedureInvocationError([err.response.data], err.response.status)
            }
        }
    }

    async call_kind_procedure(kind_name: string, procedure_name: string, input: any): Promise<any> {
        const kind: Kind = await this.get_kind(kind_name);
        const procedure: Procedural_Signature | undefined = kind.procedures[procedure_name];
        if (procedure === undefined) {
            throw new Error(`Procedure ${procedure_name} not found for kind ${kind.name}`);
        }
        const schemas: any = {};
        Object.assign(schemas, procedure.argument);
        Object.assign(schemas, procedure.result);
        this.validator.validate(input, Object.values(procedure.argument)[0], schemas);
        try {
            const { data } = await axios.post(procedure.procedure_callback, {
                input: input
            });
            this.validator.validate(data, Object.values(procedure.result)[0], schemas);
            return data;
        } catch (err) {
            if (err instanceof ValidationError) {
                throw new ProcedureInvocationError(err.errors, 500);
            } else {
                throw new ProcedureInvocationError([err.response.data], err.response.status)
            }
        }
    }

    private validate_spec(spec: Spec, kind: Kind) {
        const schemas: any = Object.assign({}, kind.kind_structure);
        this.validator.validate(spec, Object.values(kind.kind_structure)[0], schemas);
    }

    private validate_metadata_extension(extension_structure: Data_Description, metadata: Metadata | undefined) {
        if (metadata === undefined) {
            return
        }
        // Check extension structure is an empty object
        if (Object.entries(extension_structure).length === 0 && extension_structure.constructor === Object) {
            return
        }
        const schemas: any = Object.assign({}, extension_structure);
        this.validator.validate(metadata.extension, Object.values(extension_structure)[0], schemas);
    }
}