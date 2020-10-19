import axios from "axios"
import * as fs from "fs"
import * as path from "path"
import {KindBuilder, ProviderBuilder} from "../test_data_factory"
import {IntentfulBehaviour} from "papiea-core"

declare var process: {
    env: {
        SERVER_PORT: string,
        PAPIEA_ADMIN_S2S_KEY: string
    }
}
const serverPort = parseInt(process.env.SERVER_PORT || "3000")
const adminKey = process.env.PAPIEA_ADMIN_S2S_KEY || ""

const entityApi = axios.create(
    {
        baseURL: `http://127.0.0.1:${serverPort}/services`,
        timeout: 10000,
        headers: {"Content-Type": "application/json"}
    }
)

const providerApi = axios.create(
    {
        baseURL: `http://127.0.0.1:${serverPort}/provider/`,
        timeout: 1000,
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${adminKey}`
        }
    }
)

describe("Uuid validation tests", () => {
    const providerPrefix = "customValidationProvider";
    const providerVersion = "0.1.0";
    let kind_name: string
    const specOnlyEntityKind = new KindBuilder(IntentfulBehaviour.SpecOnly).build()
    specOnlyEntityKind.validation_function = fs.readFileSync(path.resolve(__dirname, "./validation.wasm"))

    beforeAll(async () => {
        const provider = new ProviderBuilder(providerPrefix).withVersion(providerVersion).withKinds([specOnlyEntityKind]).build();
        kind_name = provider.kinds[0].name;
        await providerApi.post('/', provider);
    });

    afterAll(async () => {
        await providerApi.delete(`${providerPrefix}/${providerVersion}`);
    });

    test("Uuid should validate if validation pattern is set", async () => {
        const {
            data: {
                metadata,
                spec
            }
        } = await entityApi.post(`${providerPrefix}/${providerVersion}/${kind_name}`, {
            spec: {
                x: 195,
                y: 11
            }
        })
        await entityApi.delete(`${providerPrefix}/${providerVersion}/${kind_name}/${metadata.uuid}`)
    })
})
