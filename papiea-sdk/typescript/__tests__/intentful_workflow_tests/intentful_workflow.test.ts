import { getDifferLocationDataDescription } from "../../../../papiea-engine/__tests__/test_data_factory"
import axios from "axios"
import { timeout } from "../../../../papiea-engine/src/utils/utils"
import { IntentfulStatus, Version, Metadata } from "papiea-core"
import { ProviderSdk } from "../../src/provider_sdk/typescript_sdk";
import { load } from "js-yaml"
import { readFileSync } from "fs"
import { resolve } from "path"

declare var process: {
    env: {
        SERVER_PORT: string,
        PAPIEA_ADMIN_S2S_KEY: string,
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
    timeout: 5000,
    headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminKey}`
    }
});

const providerApiAdmin = axios.create({
    baseURL: `http://127.0.0.1:${serverPort}/provider`,
    timeout: 5000,
    headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminKey}`
    }
});

describe("Intentful Workflow tests", () => {

    const locationDataDescription = getDifferLocationDataDescription()
    const locationDataDescriptionArraySfs = load(readFileSync(resolve(__dirname, "../test_data/location_kind_test_data_array_sfs.yml"), "utf-8"));
    let provider_prefix: string
    let provider_version: Version = "0.1.0"
    let to_delete_entites: Metadata[] = []

    afterEach(async () => {
        for (let metadata of to_delete_entites) {
            await entityApi.delete(`${provider_prefix}/${provider_version}/${metadata.kind}/${metadata.uuid}`)
        }
        to_delete_entites = []
        await providerApiAdmin.delete(`${provider_prefix}/${provider_version}`)
    })

    test("Change single field differ resolver should pass", async () => {
        expect.assertions(2);
        const sdk = ProviderSdk.create_provider(papieaUrl, adminKey, server_config.host, server_config.port);
        try {
            provider_prefix = "location_provider_intentful_1"
            const location = sdk.new_kind(locationDataDescription);
            sdk.version(provider_version);
            sdk.prefix(provider_prefix);
            location.on("x", async (ctx, entity, input) => {
                await providerApiAdmin.patch(`/${sdk.provider.prefix}/${sdk.provider.version}/update_status`, {
                    context: "some context",
                    entity_ref: {
                        uuid: entity.metadata.uuid,
                        kind: entity.metadata.kind
                    },
                    status: { x: entity.spec.x }
                })
            })
            location.on_create(async (ctx, entity) => {
                const { metadata, spec } = entity
                await ctx.update_status(metadata!, spec!)
            })
            await sdk.register();
            const kind_name = sdk.provider.kinds[0].name;
            const { data: { metadata, spec } } = await entityApi.post(`${ sdk.entity_url }/${ sdk.provider.prefix }/${ sdk.provider.version }/${ kind_name }`, {
                spec: {
                    x: 10,
                    y: 11
                }
            })
            to_delete_entites.push(metadata)
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
            let retries = 5
            try {
                for (let i = 1; i <= retries; i++) {
                    const res = await entityApi.get(`/intentful_task/${ task.uuid }`)
                    if (res.data.status === IntentfulStatus.Completed_Successfully) {
                        expect(res.data.status).toBe(IntentfulStatus.Completed_Successfully)
                        const result = await entityApi.get(`/${ sdk.provider.prefix }/${ sdk.provider.version }/${ kind_name }/${ metadata.uuid }`)
                        expect(result.data.status.x).toEqual(20)
                        return
                    }
                    await timeout(5000)
                }
            } catch (e) {
                console.log(`Couldn't get entity: ${e}`)
            }
        } finally {
            sdk.server.close();
        }
    })

    test("Change single field differ resolver should fail because of handler error", async () => {
        expect.assertions(2);
        const sdk = ProviderSdk.create_provider(papieaUrl, adminKey, server_config.host, server_config.port);
        try {
            provider_prefix = "location_provider_intentful_2"
            const location = sdk.new_kind(locationDataDescription);
            sdk.version(provider_version);
            sdk.prefix(provider_prefix);
            location.on("x", async (ctx, entity, input) => {
                throw new Error("Error in handler")
            })
            location.on_create(async (ctx, entity) => {
                const { metadata, spec } = entity
                await ctx.update_status(metadata!, spec!)
            })
            await sdk.register();
            const kind_name = sdk.provider.kinds[0].name;
            const { data: { metadata, spec } } = await entityApi.post(`${ sdk.entity_url }/${ sdk.provider.prefix }/${ sdk.provider.version }/${ kind_name }`, {
                spec: {
                    x: 120,
                    y: 11
                }
            })
            to_delete_entites.push(metadata)
            await timeout(5000)
            const { data: { task } } = await entityApi.put(`/${ sdk.provider.prefix }/${ sdk.provider.version }/${ kind_name }/${ metadata.uuid }`, {
                spec: {
                    x: 25,
                    y: 11
                },
                metadata: {
                    spec_version: 1
                }
            })
            let retries = 10
            try {
                for (let i = 1; i <= retries; i++) {
                    const res = await entityApi.get(`/intentful_task/${ task.uuid }`)
                    if (res.data.status === IntentfulStatus.Active && res.data.times_failed > 1) {
                        expect(res.data.times_failed).toBeGreaterThan(1)
                        expect(res.data.last_handler_error).toEqual("Error in handler")
                        return
                    }
                    await timeout(5000)
                }
            } catch (e) {
                console.log(`Couldn't get entity: ${e}`)
            }
        } finally {
            sdk.server.close();
        }
    })

    test("Change single field differ resolver should fail because of CAS fail", async () => {
        expect.assertions(1);
        const sdk = ProviderSdk.create_provider(papieaUrl, adminKey, server_config.host, server_config.port);
        try {
            provider_prefix = "location_provider_intentful_1"
            const location = sdk.new_kind(locationDataDescription);
            sdk.version(provider_version);
            sdk.prefix(provider_prefix);
            location.on("x", async (ctx, entity, input) => {
                await providerApiAdmin.patch(`/${sdk.provider.prefix}/${sdk.provider.version}/update_status`, {
                    context: "some context",
                    entity_ref: {
                        uuid: metadata.uuid,
                        kind: kind_name
                    },
                    status: { x: entity.spec.x }
                })
            })
            location.on_create(async (ctx, entity) => {
                const { metadata, spec } = entity
                await ctx.update_status(metadata!, spec!)
            })
            await sdk.register();
            const kind_name = sdk.provider.kinds[0].name;
            const { data: { metadata, spec } } = await entityApi.post(`${ sdk.entity_url }/${ sdk.provider.prefix }/${ sdk.provider.version }/${ kind_name }`, {
                spec: {
                    x: 10,
                    y: 11
                }
            })
            to_delete_entites.push(metadata)
            await timeout(5000)
            const { data: { task } } = await entityApi.put(`/${ sdk.provider.prefix }/${ sdk.provider.version }/${ kind_name }/${ metadata.uuid }`, {
                spec: {
                    x: 20,
                    y: 11
                },
                metadata: {
                    spec_version: 0
                }
            })
            try {
                const res = await entityApi.get(`/intentful_task/${ task.uuid }`)
                if (res.data.status === IntentfulStatus.Failed) {
                    expect(res.data.status).toBe(IntentfulStatus.Failed)
                    return
                }
            } catch (e) {
                console.log(`Couldn't get entity: ${e}`)
            }
        } finally {
            sdk.server.close();
        }
    })

    test("Delay to intentful operations should be awaited", async () => {
        expect.assertions(3);
        const sdk = ProviderSdk.create_provider(papieaUrl, adminKey, server_config.host, server_config.port);
        try {
            let times_requested = 0
            provider_prefix = "location_provider_intentful_3"
            const location = sdk.new_kind(locationDataDescription);
            sdk.version(provider_version);
            sdk.prefix(provider_prefix);
            location.on("x", async (ctx, entity, input) => {
                times_requested++
                if (times_requested === 2) {
                    await providerApiAdmin.patch(`/${sdk.provider.prefix}/${sdk.provider.version}/update_status`, {
                        context: "some context",
                        entity_ref: {
                            uuid: metadata.uuid,
                            kind: kind_name
                        },
                        status: { x: entity.spec.x }
                    })
                } else {
                    // 12 seconds delay
                    return {"delay_secs": 12}
                }
            })
            location.on_create(async (ctx, entity) => {
                const { metadata, spec } = entity
                await ctx.update_status(metadata!, spec!)
            })
            await sdk.register();
            const kind_name = sdk.provider.kinds[0].name;
            const { data: { metadata, spec } } = await entityApi.post(`${ sdk.entity_url }/${ sdk.provider.prefix }/${ sdk.provider.version }/${ kind_name }`, {
                spec: {
                    x: 10,
                    y: 11
                }
            })
            to_delete_entites.push(metadata)
            await timeout(5000)
            const { data: { task } } = await entityApi.put(`/${ sdk.provider.prefix }/${ sdk.provider.version }/${ kind_name }/${ metadata.uuid }`, {
                spec: {
                    x: 30,
                    y: 11
                },
                metadata: {
                    spec_version: 1
                }
            })
            try {
                await timeout(2000)
                let res = await entityApi.get(`/intentful_task/${ task.uuid }`)
                expect(res.data.status).toBe(IntentfulStatus.Active)
                await timeout(4000)
                res = await entityApi.get(`/intentful_task/${ task.uuid }`)
                expect(res.data.status).toBe(IntentfulStatus.Active)
                await timeout(12000)
                res = await entityApi.get(`/intentful_task/${ task.uuid }`)
                expect(res.data.status).toBe(IntentfulStatus.Completed_Successfully)
            } catch (e) {
                console.log(`Couldn't get entity: ${e}`)
            }
        } finally {
            sdk.server.close();
        }
    })

    test("Change single array sfs field differ resolver should pass", async () => {
        expect.assertions(2);
        const sdk = ProviderSdk.create_provider(papieaUrl, adminKey, server_config.host, server_config.port);
        try {
            provider_prefix = "location_provider_intentful_4"
            const location = sdk.new_kind(locationDataDescriptionArraySfs);
            sdk.version(provider_version);
            sdk.prefix(provider_prefix);
            location.on("x.+{ip}", async (ctx, entity, input) => {
                await providerApiAdmin.post(`/${sdk.provider.prefix}/${sdk.provider.version}/update_status`, {
                    context: "some context",
                    entity_ref: {
                        uuid: entity.metadata.uuid,
                        kind: entity.metadata.kind
                    },
                    status: entity.spec
                })
            })
            location.on_create(async (ctx, entity) => {
                const { metadata, spec } = entity
                await ctx.update_status(metadata!, spec!)
            })
            await sdk.register();
            const kind_name = sdk.provider.kinds[0].name;
            const { data: { metadata, spec } } = await entityApi.post(`${ sdk.entity_url }/${ sdk.provider.prefix }/${ sdk.provider.version }/${ kind_name }`, {
                spec: {
                    x: [{
                        ip: "1"
                    }],
                    y: 11
                }
            })
            to_delete_entites.push(metadata)
            await timeout(5000)
            const { data: { task } } = await entityApi.put(`/${ sdk.provider.prefix }/${ sdk.provider.version }/${ kind_name }/${ metadata.uuid }`, {
                spec: {
                    x: [
                        { ip: "1" },
                        { ip: "2" }
                    ],
                    y: 11
                },
                metadata: {
                    spec_version: 1
                }
            })
            let retries = 5
            try {
                for (let i = 1; i <= retries; i++) {
                    const res = await entityApi.get(`/intentful_task/${ task.uuid }`)
                    if (res.data.status === IntentfulStatus.Completed_Successfully) {
                        expect(res.data.status).toBe(IntentfulStatus.Completed_Successfully)
                        const result = await entityApi.get(`/${ sdk.provider.prefix }/${ sdk.provider.version }/${ kind_name }/${ metadata.uuid }`)
                        expect(result.data.status.x.length).toEqual(2)
                        return
                    }
                    await timeout(5000)
                }
            } catch (e) {
                console.log(`Couldn't get entity: ${e}`)
            }
        } finally {
            sdk.server.close();
        }
    })
})

describe("Intentful Workflow test sfs validation", () => {

    const locationDataDescription = getDifferLocationDataDescription()
    let provider_prefix: string
    let provider_version: Version = "0.1.0"


    test("Registering provider with wrong sfs shouldn't pass", async () => {
        expect.assertions(2);
        const sdk = ProviderSdk.create_provider(papieaUrl, adminKey, server_config.host, server_config.port);
        try {
            provider_prefix = "location_provider_intentful_fail_validation"
            const location = sdk.new_kind(locationDataDescription);
            sdk.version(provider_version);
            sdk.prefix(provider_prefix);
            location.on("wrong, wrong2", async (ctx, entity, input) => {
                await providerApiAdmin.patch(`/${ sdk.provider.prefix }/${ sdk.provider.version }/update_status`, {
                    context: "some context",
                    entity_ref: {
                        uuid: entity.metadata.uuid,
                        kind: entity.metadata.kind
                    },
                    status: { x: entity.spec.x }
                })
            })
            await sdk.register();
        } catch (e) {
            expect(e.response.status).toEqual(400)
            expect(e.response.data.error.errors[ 0 ].message).toContain("SFS: 'wrong, wrong2' validation on kind:" +
                ` ${Object.keys(locationDataDescription)[0]} failed with error: Parse error at line 1,`)
        }
    })
})
