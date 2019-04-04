import * as core from "../core";
import * as papiea from "../papiea";
import { Provider_API, Provider_Power } from "./provider_api_interface";
import { Provider_DB } from "../databases/provider_db_interface";
import { Status_DB } from "../databases/status_db_interface";
import { Provider } from "../papiea";
import { Status, Version } from "../core";
import { Data_Description } from "../core";
import { Validator } from "../validator";

export class Provider_API_Impl implements Provider_API {
    providerDb: Provider_DB;
    statusDb: Status_DB;
    private validator: Validator;

    constructor(providerDb: Provider_DB, statusDb: Status_DB) {
        this.providerDb = providerDb;
        this.statusDb = statusDb;
        this.validator = new Validator();
    }

    async register_provider(provider: papiea.Provider): Promise<void> {
        return this.providerDb.register_provider(provider);
    }

    async unregister_provider(provider_prefix: string, version: core.Version): Promise<void> {
        return this.providerDb.delete_provider(provider_prefix, version);
    }

    async update_status(context: any, entity_ref: core.Entity_Reference, status: core.Status): Promise<void> {
        await this.validate_status(entity_ref, status);
        return this.statusDb.update_status(entity_ref, status);
    }

    async update_progress(context: any, message: string, done_percent: number): Promise<void> {
        // TODO(adolgarev)
        throw new Error("Not implemented");
    }

    async power(provider_prefix: string, version: core.Version, power_state: Provider_Power): Promise<void> {
        // TODO(adolgarev)
        throw new Error("Not implemented");
    }

    async get_provider(provider_prefix: string, provider_version: Version): Promise<Provider> {
        return this.providerDb.get_provider(provider_prefix, provider_version)
    }

    async list_providers_by_prefix(provider_prefix: string): Promise<Provider[]> {
        return this.providerDb.find_providers(provider_prefix)
    }

    async get_provider_by_kind(kind_name: string): Promise<Provider> {
        return this.providerDb.get_provider_by_kind(kind_name)
    }

    async validate_status(entity_ref: core.Entity_Reference, status: Status) {
        const provider: Provider = await this.get_provider_by_kind(entity_ref.kind);
        const kind = provider.kinds.find(kind => kind.name === entity_ref.kind);
        if (kind === undefined) {
            throw new Error("Kind not found");
        }
        const schemas: any = Object.assign({}, kind.kind_structure);
        this.validator.validate(status, Object.values(kind.kind_structure)[0], schemas);
    }
}