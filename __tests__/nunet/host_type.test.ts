import "jest"
import axios from "axios"
import uuid = require("uuid");
import { ProviderSdk } from "../../src/provider_sdk/typescript_sdk";
import { Data_Description } from "../../src/core";
import { loadYaml, loadJson } from "../test_data_factory";


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

const providerApi = axios.create({
    baseURL: `http://127.0.0.1:${serverPort}/provider/`,
    timeout: 1000,
    headers: { 'Content-Type': 'application/json' }
});

const entityApi = axios.create({
    baseURL: `http://127.0.0.1:${serverPort}/entity`,
    timeout: 1000,
    headers: { 'Content-Type': 'application/json' }
});

describe("Entity API tests", () => {
    const providerPrefix = "nunet";
    const providerVersion = "0.1.0";
    const dataDescription: Data_Description = loadYaml("./nunet/host_type_data.yml");
    const kindName = "HostType";
    beforeAll(async () => {
        try {
            const { data } = await entityApi.get(`/${providerPrefix}/${kindName}`);
            for (var i = 0; i < data.length; i++) {
                await entityApi.delete(`/${providerPrefix}/${kindName}/${data[i].metadata.uuid}`);
            }
            await providerApi.delete(`${providerPrefix}/${providerVersion}`);
        } catch (e) {
        }

        const sdk = ProviderSdk.create_sdk(papiea_config.host, papiea_config.port, server_config.host, server_config.port);
        sdk.new_kind(dataDescription);
        sdk.version(providerVersion);
        sdk.prefix(providerPrefix);
        await sdk.register();
    });

    afterAll(async () => {
    });

    test("Create entity", async (done) => {
        const hostTypeList = loadJson('./nunet/host_type_list_v3.json')['entities'];
        try {
            for (var i = 0; i < hostTypeList.length; i++) {
                const hostType = hostTypeList[i];
                hostType.metadata.uuid = null;
                await entityApi.post(`/${providerPrefix}/${kindName}`, hostType);
            }
            done();
        } catch (e) {
            done.fail(e);
        }
    });

    test("Filter by tenant uuid", async (done) => {
        const hostTypeList = loadJson('./nunet/host_type_list_v3.json')['entities'];
        const tenantUuid = hostTypeList[0]['metadata']['tenant_uuid'];
        try {
            const res = await entityApi.post(`${providerPrefix}/${kindName}/filter`, {
                metadata: {
                    tenant_uuid: tenantUuid
                }
            });
            expect(res.data.length).toBeGreaterThanOrEqual(1);
        } catch (e) {
            done.fail(e);
            return;
        }
        try {
            const res = await entityApi.post(`${providerPrefix}/${kindName}/filter`, {
                metadata: {
                    tenant_uuid: uuid()
                }
            });
            expect(res.data.length).toBe(0);
        } catch (e) {
            done.fail(e);
            return;
        }
        done();
    });
});