import axios from "axios";
import { ProviderSdk } from "papiea-sdk/build/provider_sdk/typescript_sdk";
import { getLocationDataDescription, loadYaml } from "../../__tests__/test_data_factory";
import { Procedural_Execution_Strategy, Provider } from "papiea-core";

const args = process.argv
const PAPIEA_URL = args[2]
const adminKey = process.env.PAPIEA_ADMIN_S2S_KEY || '';

const server_config = {
    host: "127.0.0.1",
    port: 9000
};

const providerApiAdmin = axios.create({
    baseURL: `${PAPIEA_URL}/provider`,
    timeout: 3000,
    headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminKey}`
    }
});

const provider_version = "0.1.0"
const provider_prefix = "benchmark_provider"
const location_desc = getLocationDataDescription()

export async function setUpTestProvider(): Promise<Provider> {
    const sdk = ProviderSdk.create_provider(PAPIEA_URL, adminKey, server_config.host, server_config.port);
    const location = sdk.new_kind(location_desc);
    sdk.version(provider_version);
    sdk.prefix(provider_prefix);
    location.entity_procedure("moveX", {}, Procedural_Execution_Strategy.Halt_Intentful, loadYaml("../__tests__/test_data/procedure_move_input.yml"), loadYaml("../__tests__/test_data/location_kind_test_data.yml"), async (ctx, entity, input) => {
        entity.spec.x += input;
        const res = await axios.put(ctx.url_for(entity), {
            spec: entity.spec,
            metadata: entity.metadata
        });
        return res.data.spec;
    });
    await sdk.register();
    return sdk.provider
}

export async function cleanUpTestProvider(provider: Provider) {
    await providerApiAdmin.delete(`/${provider.prefix}/${provider.version}`);
}