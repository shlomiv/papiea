import "jest"
import axios from "axios"
import uuid = require("uuid");
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
    beforeAll(async () => {
        const kindNames = ["Geolocation", "HostType"];
        for (var j = 0; j < kindNames.length; j++) {
            const kindName = kindNames[j];
            try {
                const { data } = await entityApi.get(`/${providerPrefix}/${kindName}`);
                for (var i = 0; i < data.length; i++) {
                    await entityApi.delete(`/${providerPrefix}/${kindName}/${data[i].metadata.uuid}`);
                }
            } catch (e) {
            }
        }

        try {
            await providerApi.delete(`${providerPrefix}/${providerVersion}`);
        } catch (e) {
        }

        const provider = {
            "kinds": [
                {
                    "name": "Geolocation",
                    "name_plural": "Geolocations",
                    "kind_structure": loadYaml("./nunet/geolocation_data.yml"),
                    "intentful_signatures": {},
                    "dependency_tree": {},
                    "procedures": {}
                },
                {
                    "name": "HostType",
                    "name_plural": "HostTypes",
                    "kind_structure": loadYaml("./nunet/host_type_data.yml"),
                    "intentful_signatures": {},
                    "dependency_tree": {},
                    "procedures": {}
                }
            ],
            "version": "0.1.0",
            "prefix": "nunet"
        };
        await providerApi.post('', provider);
    });

    afterAll(async () => {
    });

    test("Create geolocations", async (done) => {
        const kindName = "Geolocation";
        const geolocationList = loadJson('./nunet/geolocation_list_v3.json')['entities'];
        try {
            for (var i = 0; i < geolocationList.length; i++) {
                const geolocation = geolocationList[i];
                geolocation.metadata.uuid = null;
                await entityApi.post(`/${providerPrefix}/${kindName}`, geolocation);
            }
            done();
        } catch (e) {
            done.fail(e);
        }
    });

    test("Filter geolocations by tenant uuid", async (done) => {
        const kindName = "Geolocation";
        const geolocationList = loadJson('./nunet/geolocation_list_v3.json')['entities'];
        const tenantUuid = geolocationList[0]['metadata']['tenant_uuid'];
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

    test("Create host types", async (done) => {
        const kindName = "HostType";
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

    test("Filter host types by tenant uuid", async (done) => {
        const kindName = "HostType";
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