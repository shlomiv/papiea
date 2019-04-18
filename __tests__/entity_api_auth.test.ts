import "jest"
import axios from "axios"
import { Metadata, Spec } from "../src/core";
import { Provider } from "../src/papiea";
import { getProviderWithSpecOnlyEnitityKindNoOperations } from "./test_data_factory";
import uuid = require("uuid");


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

const providerApi = axios.create({
    baseURL: `http://127.0.0.1:${serverPort}/provider`,
    timeout: 1000,
    headers: { 'Content-Type': 'application/json' }
});

describe("Entity API tests", () => {
    const provider: Provider = getProviderWithSpecOnlyEnitityKindNoOperations();
    const kind_name = provider.kinds[0].name;
    let entity_metadata: Metadata, entity_spec: Spec;

    beforeAll(async () => {
        await providerApi.post('/', provider);
    });

    afterAll(async () => {
        await providerApi.delete(`/${provider.prefix}/${provider.version}`);
    });

    beforeEach(async () => {
        const { data: { metadata, spec } } = await entityApi.post(`/${provider.prefix}/${kind_name}`, {
            metadata: {
                extension: {
                    owner: "alice",
                    tenant_uuid: "1"
                }
            },
            spec: {
                x: 10,
                y: 11
            }
        });
        entity_metadata = metadata;
        entity_spec = spec;
    });

    afterEach(async () => {
        await entityApi.delete(`/${provider.prefix}/${kind_name}/${entity_metadata.uuid}`);
    });

    test("Get entity should raise permission denied", async done => {
        try {
            await entityApi.get(`/${provider.prefix}/${kind_name}/${entity_metadata.uuid}`,
                { headers: { 'Owner': 'alice', 'Tenant': '1' } }
            );
            done.fail();
        } catch (e) {
            expect(e.response.status).toEqual(403);
            done();
        }
    });

    test("Get entity should succeed after policy set", async done => {
        try {
            await providerApi.post(`/${provider.prefix}/${provider.version}/auth`, {
                policy: `p, alice, owner, ${kind_name}, *, allow`
            });
            const { data: { metadata, spec } } = await entityApi.get(`/${provider.prefix}/${kind_name}/${entity_metadata.uuid}`,
                { headers: { 'Owner': 'alice', 'Tenant': '1' } }
            );
            expect(metadata).toEqual(entity_metadata);
            expect(spec).toEqual(entity_spec);
            done();
        } catch (e) {
            done.fail(e);
        }
    });
});