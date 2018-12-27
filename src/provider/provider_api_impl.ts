import * as core from "../core";
import * as papiea from "../papiea";
import { Provider_API, Provider_Power } from "./provider_api_interface";
import { Provider_DB } from "../databases/provider_db_interface";

export class Provider_API_Impl implements Provider_API {
    providerDb: Provider_DB;

    constructor(providerDb: Provider_DB) {
        this.providerDb = providerDb;
    }

    async register_provider(provider: papiea.Provider): Promise<void> {
        return;
    }

    async unregister_provider(provider_prefix: string, version: core.Version): Promise<void> {
        return;
    }

    async update_status(context: any, entity_ref: core.Entity_Reference, status: core.Status): Promise<void> {
        return;
    }

    async update_progress(context: any, message: string, done_percent: number): Promise<void> {
        return;
    }

    async power(provider_prefix: string, version: core.Version, power_state: Provider_Power): Promise<void> {
        return;
    }
}