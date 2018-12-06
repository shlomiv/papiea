// [[file:~/work/papiea-js/Papiea-design.org::*/src/databases/providers_db_interface.ts][/src/databases/providers_db_interface.ts:1]]
// [[file:~/work/papiea-js/Papiea-design.org::providers-db-interface][providers-db-interface]]

interface Providers_DB {

    // Register a new provider with the intent engine
    register_provider(provider: Provider):void;

    //Upgrade a provider - This should be in the admin?
    //upgrade_provider(from_provider: uuid4, to: providerDescription): Task;

    // get a provider
    get_provider(provider_prefix: string, version?: Version): Provider[]

    // List all registered providers
    list_providers(): Provider[]

    // Removes and de-registers a provider from the intent engine
    delete_provider(provider_uuid: uuid4): boolean;
}

// providers-db-interface ends here
// /src/databases/providers_db_interface.ts:1 ends here
