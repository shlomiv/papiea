import "jest"
import axios from "axios"
import { ProviderSdk } from "../src/provider_sdk/typescript_sdk";
import { Metadata, Spec } from "../src/core";
import { getLocationDataDescription } from "./test_data_factory";

declare var process: {
    env: {
        SERVER_PORT: string
    }
};
const serverPort = parseInt(process.env.SERVER_PORT || '3000');

const entityApi = axios.create({
    baseURL: `http://127.0.0.1:${serverPort}/entity`,
    timeout: 1000,
    headers: { 'Content-Type': 'application/json' }
});

describe("Entity API tests", () => {
    const providerPrefix = "test";
    const providerVersion = "0.1.0";
    const locationDataDescription = getLocationDataDescription();
    const kind_name = "Location";
    beforeAll(async () => {
        const sdk = new ProviderSdk();
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
    test("Create entity", async (done) => {
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

    test("Get entity", async (done) => {
        expect.assertions(1);
        try {
            const res = await entityApi.get(`/${providerPrefix}/${kind_name}/${entity_metadata.uuid}`);
            expect(res.data.spec).toEqual(entity_spec);
            done();
        } catch (e) {
            done.fail(e);
        }
    });

    test("Filter entity", async (done) => {
        try {
            const res = await entityApi.post(`${providerPrefix}/${kind_name}/filter`, {
                filter_fields: {
                    spec: {
                        x: 10,
                        y: 11
                    }
                }
            });
            expect(res.data.result.length).toBeGreaterThanOrEqual(1);
            done();
        } catch (e) {
            done.fail(e);
        }
    });

    test("Update entity spec", async (done) => {
        expect.assertions(1);
        try {
            const res = await entityApi.put(`/${providerPrefix}/${kind_name}/${entity_metadata.uuid}/${entity_metadata.spec_version}`, {
                spec: {
                    x: 20,
                    y: 21
                }
            });
            expect(res.data.spec.x).toEqual(20);
            done();
        } catch (e) {
            done.fail(e);
        }
    });

    test("Delete entity", async (done) => {
        try {
            await entityApi.delete(`/${providerPrefix}/${kind_name}/${entity_metadata.uuid}`);
            done();
        } catch (e) {
            done.fail(e);
        }
    });
});