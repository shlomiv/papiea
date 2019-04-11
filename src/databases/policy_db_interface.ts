
export interface Policy_DB {

    // Loads policy in casbin format from db
    load_policy(provider_prefix: string): Promise<string>;

    // Updates policy givven in casbin format in db
    save_policy(provider_prefix: string, policy: string): Promise<void>;
}