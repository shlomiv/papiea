import "jest"
import axios from "axios"
import {v4 as uuid4} from 'uuid';
import {Kind, Provider} from "../src/papiea";
import {ProviderSdk} from "../src/provider_sdk/typescript_sdk";
import {load} from "js-yaml";
import {readFileSync} from "fs";
import {resolve} from "path";

declare var process: {
    env: {
        SERVER_PORT: string
    }
};
const serverPort = parseInt(process.env.SERVER_PORT || '3000');

const entityApi = axios.create({
    baseURL: `http://127.0.0.1:${serverPort}/entity`,
    timeout: 1000,
    headers: {'Content-Type': 'application/json'}
});

describe("Entity API tests", () => {
    const providerPrefix = "test";
    const providerVersion = "1";
    const location_yaml = load(readFileSync(resolve(__dirname, "./location_kind_test_data.yml"), "utf-8"));
    beforeAll(async () => {
        const sdk = new ProviderSdk();
        sdk.new_kind(location_yaml);
        sdk.version(providerVersion);
        sdk.prefix(providerPrefix);
        await sdk.register();
    });

    afterAll(async () => {
        await axios.delete(`http://127.0.0.1:${serverPort}/provider/${providerPrefix}/${providerVersion}`);
    });

    test("Create entity", async (done) => {
        expect.assertions(2);
        try {
            const {data: {metadata, spec}} = await entityApi.post(`/${providerPrefix}/Location`, {
                spec: {
                    x: "10",
                    y: "11"
                }
            });
            expect(metadata).not.toBeUndefined();
            expect(spec).not.toBeUndefined();
            done();
        } catch (e) {
            done.fail(e);
        }
    });

});