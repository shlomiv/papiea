import "jest"
import axios from "axios"
import { v4 as uuid4 } from 'uuid';
import { Provider } from "../src/papiea";

declare var process: {
    env: {
        SERVER_PORT: string
    }
};
const serverPort = parseInt(process.env.SERVER_PORT || '3000');

const providerApi = axios.create({
    baseURL: `http://127.0.0.1:${serverPort}/provider/`,
    timeout: 1000,
    headers: { 'Content-Type': 'application/json' }
});

describe("Provider API tests", () => {
    const providerPrefix = "test_provider";
    const providerVersion = "0.1.0";
    test("Non-existent route", done => {
        providerApi.delete(`/abc`).then(() => done.fail()).catch(() => done());
    });
    test("Register provider", done => {
        const provider: Provider = { prefix: providerPrefix, version: providerVersion, kinds: [] };
        providerApi.post('/', provider).then(() => done()).catch(done.fail);
    });
    test("Register malformed provider", done => {
        providerApi.post('/', {}).then(() => done.fail()).catch(() => done());
    });
    // TODO(adolgarev): there is no API to list providers
    test("Unregister provider", done => {
        providerApi.delete(`/${providerPrefix}/${providerVersion}`).then(() => done()).catch(done.fail);
    });
    test("Unregister non-existend provider", done => {
        providerApi.delete(`/${providerPrefix}/${providerVersion}`).then(() => done.fail()).catch(() => done());
    });
    test("Unregister never existed provider", done => {
        providerApi.delete(`/123/123`).then(() => done.fail()).catch(() => done());
    });
    const entityA_uuid = uuid4();
    test("Update status", done => {
        providerApi.post('/update_status', {
            context: "some context",
            entity_ref: {
                uuid: entityA_uuid,
                kind: "test"
            },
            status: { a: "A" }
        }).then(() => done()).catch(done.fail);
    });
    // TODO(adolgarev): there is no API at the moment to list statuses
});