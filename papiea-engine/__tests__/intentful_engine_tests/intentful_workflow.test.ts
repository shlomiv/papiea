import { getDifferLocationDataDescription, loadYaml } from "../test_data_factory"
import { IntentfulStatus } from "papiea-core"
import axios from "axios"
import { ProviderSdk } from "papiea-sdk"
import { Procedural_Execution_Strategy } from "papiea-core"
import { timeout } from "../../src/utils/utils"

declare var process: {
    env: {
        SERVER_PORT: string,
        PAPIEA_ADMIN_S2S_KEY: string
    }
};
const serverPort = parseInt(process.env.SERVER_PORT || '3000');
const adminKey = process.env.PAPIEA_ADMIN_S2S_KEY || '';
const papieaUrl = 'http://127.0.0.1:3000';

const server_config = {
    host: "127.0.0.1",
    port: 9000
};

const entityApi = axios.create({
    baseURL: `http://127.0.0.1:${serverPort}/services`,
    timeout: 1000,
    headers: { 'Content-Type': 'application/json' }
});

const providerApiAdmin = axios.create({
    baseURL: `http://127.0.0.1:${serverPort}/provider`,
    timeout: 1000,
    headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminKey}`
    }
});

describe("Intentful Task tests", () => {

    const locationDataDescription = getDifferLocationDataDescription()
    const name = Object.keys(locationDataDescription)[0]
    const provider_version = "0.1.0";

    test("Change single field intentful workflow should pass", async () => {
        expect.hasAssertions();
        const sdk = ProviderSdk.create_provider(papieaUrl, adminKey, server_config.host, server_config.port);
        try {
            const location = sdk.new_kind(locationDataDescription);
            sdk.version(provider_version);
            sdk.prefix("location_provider_intentful");
            location.on("x", {}, Procedural_Execution_Strategy.Halt_Intentful, loadYaml("./test_data/intentful_handler_input.yml"), {}, async (ctx, entity, input) => {
                entity.spec.x = input[0]['spec-val'][0]
                await providerApiAdmin.patch('/update_status', {
                    context: "some context",
                    entity_ref: {
                        uuid: metadata.uuid,
                        kind: kind_name
                    },
                    status: { x: entity.spec.x }
                })
            }, "x_handler")
            await sdk.register();
            const kind_name = sdk.provider.kinds[0].name;
            const { data: { metadata, spec } } = await axios.post(`${ sdk.entity_url }/${ sdk.provider.prefix }/${ sdk.provider.version }/${ kind_name }`, {
                spec: {
                    x: 10,
                    y: 11
                }
            })
            await timeout(5000)
            const { data: { task } } = await entityApi.put(`/${ sdk.provider.prefix }/${ sdk.provider.version }/${ kind_name }/${ metadata.uuid }`, {
                spec: {
                    x: 20,
                    y: 11
                },
                metadata: {
                    spec_version: 1
                }
            })
            await timeout(10000)
            const result = await entityApi.get(`/intentful_task/${ task.uuid }`)
            expect(result.data.status).toEqual(IntentfulStatus.Completed_Successfully)
        } finally {
            sdk.server.close();
        }
    })
})