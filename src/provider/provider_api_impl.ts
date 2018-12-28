import * as core from "../core";
import * as papiea from "../papiea";
import { Provider_API, Provider_Power } from "./provider_api_interface";
import { Provider_DB } from "../databases/provider_db_interface";
import { Status_DB } from "../databases/status_db_interface";

export class Provider_API_Impl implements Provider_API {
    providerDb: Provider_DB;
    statusDb: Status_DB;

    constructor(providerDb: Provider_DB, statusDb: Status_DB) {
        this.providerDb = providerDb;
        this.statusDb = statusDb;
    }

    async register_provider(provider: papiea.Provider): Promise<void> {
        return this.providerDb.register_provider(provider);
    }

    async unregister_provider(provider_prefix: string, version: core.Version): Promise<void> {
        return this.providerDb.delete_provider(provider_prefix, version);
    }

    async update_status(context: any, entity_ref: core.Entity_Reference, status: core.Status): Promise<void> {
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
}