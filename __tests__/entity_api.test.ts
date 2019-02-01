import "jest"
import axios from "axios"
import { ProviderSdk } from "../src/provider_sdk/typescript_sdk";
import { Metadata, Spec } from "../src/core";
import { getLocationDataDescription } from "./test_data_factory";
import { stringify } from "querystring"


declare var process: {
    env: {
        SERVER_PORT: string
    }
};
const serverPort = parseInt(process.env.SERVER_PORT || '3000');

const papiea_config = {
    host: "127.0.0.1",
    port: 3000
};

const server_config = {
    host: "127.0.0.1",
    port: 9000
};

const entityApi = axios.create({
    baseURL: `http://127.0.0.1:${ serverPort }/entity`,
    timeout: 1000,
    headers: { 'Content-Type': 'application/json' }
});

describe("Entity API tests", () => {
    const providerPrefix = "test";
    const providerVersion = "0.1.0";
    const locationDataDescription = getLocationDataDescription();
    const kind_name = "Location";
    beforeAll(async () => {
        const sdk = ProviderSdk.create_sdk(papiea_config.host, papiea_config.port, server_config.host, server_config.port);
        sdk.new_kind(locationDataDescription);
        sdk.version(providerVersion);
        sdk.prefix(providerPrefix);
        await sdk.register();
    });

    afterAll(async () => {
        await axios.delete(`http://127.0.0.1:${ serverPort }/provider/${ providerPrefix }/${ providerVersion }`);
    });

    let entity_metadata: Metadata;
    let entity_spec: Spec;
    test("Create entity", async (done) => {
        expect.assertions(3);
        try {
            const { data: { metadata, spec } } = await entityApi.post(`/${ providerPrefix }/${ kind_name }`, {
                spec: {
                    x: 10,
                    y: 11
                }
            });
            expect(metadata).not.toBeUndefined();
            expect(metadata.spec_version).toEqual(1);
            expect(spec).not.toBeUndefined();
            entity_metadata = metadata;
            entity_spec = spec;
            done();
        } catch (e) {
            done.fail(e);
        }
    });

    test("Create entity with malformed spec should fail", async (done) => {
        expect.assertions(2);
        try {
            await entityApi.post(`/${ providerPrefix }/${ kind_name }`, {
                spec: {
                    x: "Totally not a number",
                    y: 11
                }
            });
        } catch (err) {
            const res = err.response;
            expect(res.status).toEqual(400);
            expect(res.data.errors.length).toEqual(1);
            done();
        }
    });

    test("Get entity", async (done) => {
        expect.assertions(1);
        try {
            const res = await entityApi.get(`/${ providerPrefix }/${ kind_name }/${ entity_metadata.uuid }`);
            expect(res.data.spec).toEqual(entity_spec);
            done();
        } catch (e) {
            done.fail(e);
        }
    });

    test("Filter entity", async (done) => {
        try {
            const res = await entityApi.post(`${ providerPrefix }/${ kind_name }/filter`, {
                filter_fields: {
                    spec: {
                        x: 10,
                        y: 11
                    }
                }
            });
            expect(res.data.length).toBeGreaterThanOrEqual(1);
            done();
        } catch (e) {
            done.fail(e);
        }
    });

    test("Filter entity with query params", async (done) => {
        const spec = {
            x: 10,
            y: 11
        };
        const spec_query = {
            spec: JSON.stringify(spec)
        };
        try {
            const res = await entityApi.get(`${ providerPrefix }/${ kind_name }?${ stringify(spec_query) }`,);
            expect(res.data.length).toBeGreaterThanOrEqual(1);
            done();
        } catch (e) {
            done.fail(e);
        }
    });

    test("Update entity spec", async (done) => {
        expect.assertions(1);
        try {
            const res = await entityApi.put(`/${ providerPrefix }/${ kind_name }/${ entity_metadata.uuid }`, {
                spec: {
                    x: 20,
                    y: 21
                },
                metadata: {
                    spec_version: 1
                }
            });
            expect(res.data.spec.x).toEqual(20);
            done();
        } catch (e) {
            done.fail(e);
        }
    });

    test("Update entity with malformed spec should fail", async (done) => {
        expect.assertions(2);
        try {
            await entityApi.put(`/${ providerPrefix }/${ kind_name }/${ entity_metadata.uuid }`, {
                spec: {
                    x: "Totally not a number",
                    y: 21
                },
                metadata: {
                    spec_version: 1
                }
            });
        } catch (err) {
            const res = err.response;
            expect(res.status).toEqual(400);
            expect(res.data.errors.length).toEqual(1);
            done();
        }
    });

    test("Create entity without additional fields, additional fields should be empty", async (done) => {
        expect.assertions(4);
        try {
            const { data: { metadata, spec } } = await entityApi.post(`/${ providerPrefix }/${ kind_name }`, {
                spec: {
                    x: 10,
                    y: 11
                },
            });
            expect(metadata).not.toBeUndefined();
            expect(metadata.spec_version).toEqual(1);
            expect(spec).not.toBeUndefined();
            expect(metadata.additional_data).toBeUndefined();
            await entityApi.delete(`/${ providerPrefix }/${ kind_name }/${ metadata.uuid }`);
            done();
        } catch (e) {
            done.fail(e);
        }
    });

    test("Create entity with additional fields", async (done) => {
        expect.assertions(4);
        try {
            const { data: { metadata, spec } } = await entityApi.post(`/${ providerPrefix }/${ kind_name }`, {
                spec: {
                    x: 10,
                    y: 11
                },
                additional_data: {
                    _key: "123"
                }
            });
            expect(metadata).not.toBeUndefined();
            expect(metadata.spec_version).toEqual(1);
            expect(spec).not.toBeUndefined();
            expect(metadata.additional_data._key).toBe("123");
            await entityApi.delete(`/${ providerPrefix }/${ kind_name }/${ metadata.uuid }`);
            done();
        } catch (e) {
            done.fail(e);
        }
    });

    test("Delete entity", async (done) => {
        try {
            await entityApi.delete(`/${ providerPrefix }/${ kind_name }/${ entity_metadata.uuid }`);
            done();
        } catch (e) {
            done.fail(e);
        }
        try {
            await entityApi.get(`/${ providerPrefix }/${ kind_name }/${ entity_metadata.uuid }`);
            done.fail("Entity has not been removed");
        } catch (e) {
            done();
        }
    });
});