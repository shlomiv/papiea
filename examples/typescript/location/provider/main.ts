import { register_provider } from "./provider";
import { location_provider_config, papiea_config } from "./config";
import { ProviderSdk } from "../../../../src/provider_sdk/typescript_sdk";


async function main() {

    //Instantiate SDK
    const sdk = ProviderSdk.create_sdk(papiea_config);

    //Register provider with SDK
    await register_provider(sdk, location_provider_config.provider.kind_description, location_provider_config.provider.version, location_provider_config.provider.prefix);

}

main().then().catch(err => {
    console.error(err)
});