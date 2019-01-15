import { ProviderSdk } from "../../src/provider_sdk/typescript_sdk";
import { Provider } from "../../src/papiea";
import { Version } from "../../src/core";


export async function register_provider(sdk: ProviderSdk, kind_description: any, version: Version, prefix: string): Promise<Provider> {

    //Specify the provider kind, version & prefix
    sdk.new_kind(kind_description);
    sdk.version(version);
    sdk.prefix(prefix);

    try {
        //Register the provider with papiea SDK instance
        await sdk.register()
    } catch (e) {
        console.error(e)
    }

    return sdk.provider;
}