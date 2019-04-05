import "jest"
import axios from "axios"
import { ProviderSdk } from "../src/provider_sdk/typescript_sdk";
import { Metadata, Spec } from "../src/core";
import { getLocationDataDescription } from "./test_data_factory";
import { stringify } from "querystring"
import uuid = require("uuid");


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
    baseURL: `http://127.0.0.1:${serverPort}/entity`,
    timeout: 1000,
    headers: { 'Content-Type': 'application/json' }
});

describe("Entity API tests", () => {
    const providerPrefix = "test";
    const providerVersion = "0.1.0";
    const locationDataDescription = getLocationDataDescription();
    const kind_name = Object.keys(locationDataDescription)[0];
    beforeAll(async () => {
        const sdk = ProviderSdk.create_sdk(papiea_config.host, papiea_config.port, server_config.host, server_config.port);
        sdk.new_kind(locationDataDescription);
        sdk.version(providerVersion);
        sdk.prefix(providerPrefix);
        await sdk.register();
    });

    afterAll(async () => {
        await axios.delete(`http://127.0.0.1:${serverPort}/provider/${providerPrefix}/${providerVersion}`);
    });

    let entity_metadata: Metadata;
    let entity_spec: Spec;
    test("Create spec-only entity", async (done) => {
        expect.assertions(3);
        try {
            const { data: { metadata, spec } } = await entityApi.post(`/${providerPrefix}/${kind_name}`, {
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
            await entityApi.post(`/${providerPrefix}/${kind_name}`, {
                spec: {
                    x: "Totally not a number",
                    y: 11
                }
            });
            done.fail();
        } catch (err) {
            const res = err.response;
            expect(res.status).toEqual(400);
            expect(res.data.errors.length).toEqual(1);
            done();
        }
    });

    test("Get spec-only entity", async (done) => {
        expect.assertions(2);
        try {
            const res = await entityApi.get(`/${providerPrefix}/${kind_name}/${entity_metadata.uuid}`);
            expect(res.data.spec).toEqual(entity_spec);
            expect(res.data.status).toEqual(entity_spec);
            done();
        } catch (e) {
            done.fail(e);
        }
    });

    test("Get non-existent spec-only entity should fail", async (done) => {
        expect.assertions(2);
        try {
            await entityApi.get(`/${ providerPrefix }/${ kind_name }/${ uuid() }`);
            done.fail();
        } catch (e) {
            expect(e.response.status).toBe(404);
            expect(e.response.data).not.toBeUndefined();
            done();
        }
    });

    test("Filter entity", async (done) => {
        try {
            let res = await entityApi.post(`${providerPrefix}/${kind_name}/filter`, {
                spec: {
                    x: 10,
                    y: 11
                }
            });
            expect(res.data.length).toBeGreaterThanOrEqual(1);
            res = await entityApi.post(`${providerPrefix}/${kind_name}/filter`, {
                spec: {
                    x: 10,
                    y: 11,
                    z: 111
                }
            });
            expect(res.data.length).toBe(0);
            done();
        } catch (e) {
            done.fail(e);
        }
    });

    test("Filter spec only entity should contain status", async (done) => {
        try {
            const res = await entityApi.post(`${providerPrefix}/${kind_name}/filter`, {
                spec: {
                    x: 10,
                    y: 11
                }
            });
            expect(res.data.length).toBeGreaterThanOrEqual(1);
            const entity = res.data[0];
            expect(entity.spec.x).toEqual(10);
            expect(entity.status).toEqual(entity.spec);
            done();
        } catch (e) {
            done.fail(e);
        }
    });

    test("Filter entity by status", async (done) => {
        try {
            let res = await entityApi.post(`${providerPrefix}/${kind_name}/filter`, {
                status: {
                    x: 10,
                    y: 11
                }
            });
            expect(res.data.length).toBeGreaterThanOrEqual(1);
            res.data.forEach((entity: any) => {
                expect(entity.status.x).toEqual(10);
                expect(entity.status.y).toEqual(11);
            });
            res = await entityApi.post(`${providerPrefix}/${kind_name}/filter`, {
                status: {
                    x: 10
                }
            });
            expect(res.data.length).toBeGreaterThanOrEqual(1);
            res.data.forEach((entity: any) => {
                expect(entity.status.x).toEqual(10);
            });
            res = await entityApi.post(`${providerPrefix}/${kind_name}/filter`, {
                status: {
                    x: 10,
                    z: 1111
                }
            });
            expect(res.data.length).toBe(0);
            done();
        } catch (e) {
            done.fail(e);
        }
    });

    test("Filter entity by spec and status", async (done) => {
        try {
            const res = await entityApi.post(`${providerPrefix}/${kind_name}/filter`, {
                spec: {
                    x: 10,
                    y: 11
                },
                status: {
                    x: 10,
                    y: 11
                }
            });
            expect(res.data.length).toBeGreaterThanOrEqual(1);
            res.data.forEach((entity: any) => {
                expect(entity.spec.x).toEqual(10);
                expect(entity.spec.y).toEqual(11);
                expect(entity.status.x).toEqual(10);
                expect(entity.status.y).toEqual(11);
            });
            done();
        } catch (e) {
            done.fail(e);
        }
    });

    test("Filter entity by nested fields", async (done) => {
        try {
            await entityApi.post(`/${providerPrefix}/${kind_name}`, {
                spec: {
                    x: 10,
                    y: 11,
                    v: {
                        e: 12,
                        d: 13
                    }
                }
            });
            let res = await entityApi.post(`${providerPrefix}/${kind_name}/filter`, {
                spec: {
                    x: 10,
                    "v.e": 12
                }
            });
            expect(res.data.length).toBeGreaterThanOrEqual(1);
            res.data.forEach((entity: any) => {
                expect(entity.spec.x).toEqual(10);
                expect(entity.spec.v.e).toEqual(12);
            });
            res = await entityApi.post(`${providerPrefix}/${kind_name}/filter`, {
                spec: {
                    x: 10,
                    v: {
                        e: 12,
                        d: 13
                    }
                }
            });
            expect(res.data.length).toBeGreaterThanOrEqual(1);
            res.data.forEach((entity: any) => {
                expect(entity.spec.x).toEqual(10);
                expect(entity.spec.v.e).toEqual(12);
            });
            res = await entityApi.post(`${providerPrefix}/${kind_name}/filter`, {
                spec: {
                    x: 10,
                    v: {
                        e: 12
                    }
                }
            });
            expect(res.data.length).toBe(0);
            
            res = await entityApi.post(`${providerPrefix}/${kind_name}/filter`, {
                status: {
                    x: 10,
                    "v.e": 12
                }
            });
            expect(res.data.length).toBeGreaterThanOrEqual(1);
            res.data.forEach((entity: any) => {
                expect(entity.status.x).toEqual(10);
                expect(entity.status.v.e).toEqual(12);
            });
            res = await entityApi.post(`${providerPrefix}/${kind_name}/filter`, {
                status: {
                    x: 10,
                    v: {
                        e: 12,
                        d: 13
                    }
                }
            });
            expect(res.data.length).toBeGreaterThanOrEqual(1);
            res.data.forEach((entity: any) => {
                expect(entity.status.x).toEqual(10);
                expect(entity.status.v.e).toEqual(12);
            });
            res = await entityApi.post(`${providerPrefix}/${kind_name}/filter`, {
                status: {
                    x: 10,
                    v: {
                        e: 12
                    }
                }
            });
            expect(res.data.length).toBe(0);

            res = await entityApi.post(`${providerPrefix}/${kind_name}/filter`, {
                spec: {
                    x: 10,
                    "v.e": 12
                },
                status: {
                    x: 10,
                    "v.e": 12
                }
            });
            expect(res.data.length).toBeGreaterThanOrEqual(1);
            res.data.forEach((entity: any) => {
                expect(entity.spec.x).toEqual(10);
                expect(entity.spec.v.e).toEqual(12);
                expect(entity.status.x).toEqual(10);
                expect(entity.status.v.e).toEqual(12);
            });

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
            const res = await entityApi.get(`${providerPrefix}/${kind_name}?${stringify(spec_query)}`);
            expect(res.data.length).toBeGreaterThanOrEqual(1);
            done();
        } catch (e) {
            done.fail(e);
        }
    });

    test("Update spec-only entity spec", async (done) => {
        expect.assertions(3);
        try {
            let res = await entityApi.put(`/${providerPrefix}/${kind_name}/${entity_metadata.uuid}`, {
                spec: {
                    x: 20,
                    y: 21
                },
                metadata: {
                    spec_version: 1
                }
            });
            expect(res.data.spec.x).toEqual(20);
            res = await entityApi.get(`/${providerPrefix}/${kind_name}/${entity_metadata.uuid}`);
            expect(res.data.spec.x).toEqual(20);
            expect(res.data.status.x).toEqual(20);
            done();
        } catch (e) {
            done.fail(e);
        }
    });

    test("Update entity with malformed spec should fail", async (done) => {
        expect.assertions(3);
        try {
            const { data: { metadata, spec } } = await entityApi.post(`/${providerPrefix}/${kind_name}`, {
                spec: {
                    x: 10,
                    y: 11
                }
            });
            expect(metadata).not.toBeUndefined();
            await entityApi.put(`/${providerPrefix}/${kind_name}/${metadata.uuid}`, {
                spec: {
                    x: "Totally not a number",
                    y: 21
                },
                metadata: {
                    spec_version: 1
                }
            });
            done.fail();
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
            const { data: { metadata, spec } } = await entityApi.post(`/${providerPrefix}/${kind_name}`, {
                spec: {
                    x: 10,
                    y: 11
                },
            });
            expect(metadata).not.toBeUndefined();
            expect(metadata.spec_version).toEqual(1);
            expect(spec).not.toBeUndefined();
            expect(metadata._key).toBeUndefined();
            await entityApi.delete(`/${providerPrefix}/${kind_name}/${metadata.uuid}`);
            done();
        } catch (e) {
            done.fail(e);
        }
    });

    test("Create entity with additional fields", async (done) => {
        expect.assertions(4);
        try {
            const { data: { metadata, spec } } = await entityApi.post(`/${providerPrefix}/${kind_name}`, {
                spec: {
                    x: 10,
                    y: 11
                },
                metadata: {
                    _key: "123"
                }
            });
            expect(metadata).not.toBeUndefined();
            expect(metadata.spec_version).toEqual(1);
            expect(spec).not.toBeUndefined();
            expect(metadata._key).toBe("123");
            await entityApi.delete(`/${providerPrefix}/${kind_name}/${metadata.uuid}`);
            done();
        } catch (e) {
            done.fail(e);
        }
    });

    test("Filter entity by additional fields", async (done) => {
        try {
            await entityApi.post(`/${providerPrefix}/${kind_name}`, {
                spec: {
                    x: 10,
                    y: 11
                },
                metadata: {
                    _key: "123"
                }
            });
            const res = await entityApi.post(`${providerPrefix}/${kind_name}/filter`, {
                metadata: {
                    _key: "123"
                }
            });
            expect(res.data.length).toBeGreaterThanOrEqual(1);
        } catch (e) {
            done.fail(e);
            return;
        }
        try {
            const res = await entityApi.post(`${providerPrefix}/${kind_name}/filter`, {
                metadata: {
                    _key: "abc"
                }
            });
            expect(res.data.length).toBe(0);
        } catch (e) {
            done.fail(e);
            return;
        }
        done();
    });

    test("Create entity with non valid uuid should be an error", async (done) => {
        try {
            const { data: { metadata, spec } } = await entityApi.post(`/${providerPrefix}/${kind_name}`, {
                spec: {
                    x: 10,
                    y: 11
                },
                metadata: {
                    uuid: "123"
                }
            });
        } catch (e) {
            done();
        }
    });

    test("Create entity and provide uuid", async (done) => {
        try {
            const entity_uuid = uuid();
            const { data: { metadata, spec } } = await entityApi.post(`/${providerPrefix}/${kind_name}`, {
                spec: {
                    x: 10,
                    y: 11
                },
                metadata: {
                    uuid: entity_uuid
                }
            });
            expect(metadata.uuid).toEqual(entity_uuid);
            const res = await entityApi.get(`/${providerPrefix}/${kind_name}/${entity_uuid}`);
            expect(res.data.metadata.uuid).toEqual(entity_uuid);
            done();
        } catch (e) {
            done.fail(e);
        }
    });

    test("Delete entity", async (done) => {
        try {
            await entityApi.delete(`/${providerPrefix}/${kind_name}/${entity_metadata.uuid}`);
        } catch (e) {
            done.fail(e);
            return;
        }
        try {
            await entityApi.get(`/${providerPrefix}/${kind_name}/${entity_metadata.uuid}`);
            done.fail("Entity has not been removed");
        } catch (e) {
            done();
        }
    });

    test("Filter deleted entity", async (done) => {
        try {
            const { data: { metadata, spec } } = await entityApi.post(`/${providerPrefix}/${kind_name}`, {
                spec: {
                    x: 10,
                    y: 11
                }
            });
            await entityApi.delete(`/${providerPrefix}/${kind_name}/${metadata.uuid}`);
            let res = await entityApi.post(`${providerPrefix}/${kind_name}/filter`, {
                metadata: {
                    uuid: metadata.uuid
                }
            });
            expect(res.data.length).toBe(0);
            ["papiea_one_hour_ago", "papiea_one_day_ago"].forEach(async deleted_at => {
                let res = await entityApi.post(`${providerPrefix}/${kind_name}/filter`, {
                    metadata: {
                        uuid: metadata.uuid,
                        deleted_at: deleted_at
                    }
                });
                expect(res.data.length).toBe(1);
                expect(res.data[0].spec).toEqual(spec);
                expect(res.data[0].status).toEqual(spec);
            })
            done();
        } catch (e) {
            done.fail(e);
        }
    });
});