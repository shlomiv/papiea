import { getSpecOnlyKind, ProviderBuilder } from "../test_data_factory"
import axios from "axios"

declare var process: {
    env: {
        SERVER_PORT: string,
        PAPIEA_ADMIN_S2S_KEY: string
    }
};
const serverPort = parseInt(process.env.SERVER_PORT || '3000');
const adminKey = process.env.PAPIEA_ADMIN_S2S_KEY || '';

const entityApi = axios.create({
    baseURL: `http://127.0.0.1:${serverPort}/services`,
    timeout: 10000,
    headers: { 'Content-Type': 'application/json' }
});

const providerApi = axios.create({
    baseURL: `http://127.0.0.1:${serverPort}/provider/`,
    timeout: 1000,
    headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminKey}`
    }
});

describe("Uuid validation tests", () => {
    const providerPrefix = "test_validation_uuid";
    const providerVersion = "0.1.0";
    let kind_name: string
    const specOnlyEntityKind = getSpecOnlyKind()
    specOnlyEntityKind.uuid_validation_pattern = "^a$"

    beforeAll(async () => {
        const provider = new ProviderBuilder(providerPrefix).withVersion(providerVersion).withKinds([specOnlyEntityKind]).build();
        kind_name = provider.kinds[0].name;
        await providerApi.post('/', provider);
    });

    afterAll(async () => {
        await providerApi.delete(`${providerPrefix}/${providerVersion}`);
    });

    test("Uuid should validate if validation pattern is set", async () => {
        const { data: { metadata, spec } } = await entityApi.post(`${providerPrefix}/${providerVersion}/${kind_name}`, {
            spec: {
                x: 105,
                y: 11
            },
            metadata: {
                uuid: "a"
            }
        })
        expect(metadata.uuid).toBe("a")
        await entityApi.delete(`${providerPrefix}/${providerVersion}/${kind_name}/${metadata.uuid}`)
    })

    test("Uuid shouldn't validate if validation pattern is set and uuid is not correct", async () => {
        try {
            const { data: { metadata, spec } } = await entityApi.post(`${ providerPrefix }/${ providerVersion }/${ kind_name }`, {
                spec: {
                    x: 10,
                    y: 11
                },
                metadata: {
                    uuid: "b"
                }
            })
        } catch (e) {
            expect(e.response.data.error.message).toEqual("uuid is not valid")
        }
    })

    test("Uuid should be unique", async () => {
        const { data: { metadata, spec } } = await entityApi.post(`${providerPrefix}/${providerVersion}/${kind_name}`, {
            spec: {
                x: 150,
                y: 11
            },
            metadata: {
                uuid: "a"
            }
        })
        try {
            await entityApi.post(`${ providerPrefix }/${ providerVersion }/${ kind_name }`, {
                spec: {
                    x: 10,
                    y: 11
                },
                metadata: {
                    uuid: "a"
                }
            })
        } catch (e) {
            expect(e.response.data.error.message).toEqual("An entity with this uuid already exists")
        }
        console.log(metadata.uuid)
        await entityApi.delete(`${providerPrefix}/${providerVersion}/${kind_name}/${metadata.uuid}`)
        try {
            const res = await entityApi.get(`${ providerPrefix }/${ providerVersion }/${ kind_name }/a`)
            console.log(res.data.metadata)
            console.log(res.data.metadata.deleted_at)
            console.log("Found")
        } catch (e) {
            console.log("Not found")
        }
    })

    test("Uuid should be provided if there is a pattern specified", async () => {
        try {
            const { data: { metadata, spec } } = await entityApi.post(`${ providerPrefix }/${ providerVersion }/${ kind_name }`, {
                spec: {
                    x: 10,
                    y: 11
                }
            })
        } catch (e) {
            expect(e.response.data.error.message).toEqual("Uuid is not provided, but supposed to be since validation pattern is specified")
        }
    })
});
