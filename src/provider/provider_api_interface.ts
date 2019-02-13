import * as core from "../core";
import * as papiea from "../papiea";
import { Provider } from "../papiea";
import { Status } from "../core";
import { Data_Description } from "../core";


// This will be provided using REST APIs. 

export enum Provider_Power {On, Off, Suspended};

export interface Provider_API {

    // Registers a provider to the Provider's DB
    // POST "/provider"
    register_provider(provider: papiea.Provider): Promise<void>;

    // DELETE "/provider/{prefix}/{version}"
    unregister_provider(provider_prefix: string, version: core.Version): Promise<void>;

    // Updating status and progress
    // POST "/provider/update_status"
    update_status(context: any, entity_ref: core.Entity_Reference, status: core.Status): Promise<void>;

    // POST "/provider/update_progress"
    update_progress(context: any, message: string, done_percent: number): Promise<void>;

    // Binny wants to rename this
    // POST "/provider/{prefix}/{version}/power"
    power(provider_prefix: string, version: core.Version, power_state: Provider_Power): Promise<void>;

    get_provider_by_kind(kind_name: string): Promise<Provider>;

    validate_status(status: Status, kind_structure: Data_Description): void;
}