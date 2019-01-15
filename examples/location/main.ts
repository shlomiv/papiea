import { ProviderSdk } from "../../src/provider_sdk/typescript_sdk";
import { register_provider } from "./provider";
import { create_entity, delete_entity, update_entity } from "./entity";
import { location_entity_config, location_provider_config, papiea_config } from "./config";


async function main() {

    //Instantiate SDK
    const sdk = ProviderSdk.create_sdk(papiea_config);

    //Register provider with SDK
    const provider = await register_provider(sdk, location_provider_config.provider.kind_description, location_provider_config.provider.version, location_provider_config.provider.prefix);

    //Create entity on provider with kind
    const [metadata] = await create_entity(provider, provider.kinds[0], location_entity_config.entity.initial_spec, sdk.entity_url);

    //Update entity on provider with kind
    await update_entity(provider, provider.kinds[0], location_entity_config.entity.update_spec, metadata, sdk.entity_url);

    //Delete entity on provider with kind
    await delete_entity(provider, provider.kinds[0], metadata, sdk.entity_url);
}

main().then().catch(err => {
    console.error(err)
});