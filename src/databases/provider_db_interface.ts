// [[file:~/work/papiea-js/Papiea-design.org::*/src/databases/provider_db_interface.ts][/src/databases/provider_db_interface.ts:1]]
import * as core from "../core";
import * as papiea from "../papiea";
import { Provider } from "../papiea";

// [[file:~/work/papiea-js/Papiea-design.org::#h-Interface-104][provider-db-interface]]

export interface Provider_DB {

    // Register a new provider with the intent engine
    register_provider(provider: papiea.Provider): Promise<void>;

    //Upgrade a provider - This should be in the admin?
    //upgrade_provider(from_provider: uuid4, to: providerDescription): Task;

    // get a provider
    get_provider(provider_prefix: string, version: core.Version): Promise<papiea.Provider>

    // List all registered providers
    list_providers(): Promise<papiea.Provider[]>

    // Removes and de-registers a provider from the intent engine
    delete_provider(provider_prefix: string, version: core.Version): Promise<void>;

    get_latest_provider_by_kind(kind_name: string): Promise<Provider>;

    find_providers(provider_prefix: string): Promise<Provider[]>;

    get_latest_provider(provider_prefix: string): Promise<Provider>;
}

// provider-db-interface ends here
// /src/databases/provider_db_interface.ts:1 ends here
