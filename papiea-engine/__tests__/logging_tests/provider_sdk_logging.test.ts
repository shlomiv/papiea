import { load } from "js-yaml"
import { resolve } from "path"
import { ProviderSdk } from "papiea-sdk"
import { loadYaml } from "../test_data_factory"
import axios from "axios"
import { readFileSync } from "fs"
import { Procedural_Execution_Strategy } from "papiea-core"
import * as fs from "fs"
import * as path from "path"

declare var process: {
    env: {
        SERVER_PORT: string,
        PAPIEA_ADMIN_S2S_KEY: string
    }
}
const adminKey = process.env.PAPIEA_ADMIN_S2S_KEY || ''
const papieaUrl = 'http://127.0.0.1:3000'

const server_config = {
    host: "127.0.0.1",
    port: 9000
}

describe("Provider Sdk logging tests", () => {
    const provider_version = "0.1.0"
    const location_yaml = load(readFileSync(resolve(__dirname, "../test_data/location_kind_test_data.yml"), "utf-8"))
    test("Provider with provider level procedures logging should work", async () => {
        expect.hasAssertions()
        const sdk = ProviderSdk.create_provider(papieaUrl, adminKey, server_config.host, server_config.port)
        const location = sdk.new_kind(location_yaml)
        sdk.version(provider_version)
        sdk.prefix("location_provider_logging_tester")
        location.entity_procedure("moveX", {}, Procedural_Execution_Strategy.Halt_Intentful, loadYaml("./test_data/procedure_move_input.yml"), loadYaml("./test_data/location_kind_test_data.yml"), async (ctx, entity, input) => {
            entity.spec.x += input
            const res = await axios.put(ctx.url_for(entity), {
                spec: entity.spec,
                metadata: entity.metadata
            })
            return res.data.spec
        })
        sdk.provider_procedure("computeSum",
            {},
            Procedural_Execution_Strategy.Halt_Intentful,
            loadYaml("./test_data/procedure_sum_input.yml"),
            loadYaml("./test_data/procedure_sum_output.yml"),
            async (ctx, input, loggerFactory) => {
                const logger = loggerFactory.createLogger()
                logger.info(`Sum result ${ input.a + input.b }`)
                return input.a + input.b
            }
        )
        await sdk.register()
        try {
            const res: any = await axios.post(`${ sdk.entity_url }/${ sdk.provider.prefix }/${ sdk.provider.version }/procedure/computeSum`, {
                input: {
                    "a": 5,
                    "b": 5
                }
            })
            expect(res.data).toBe(10)
            const msleep = (time: number) => new Promise(resolve => setTimeout(_ => resolve(), time))
            // Wait till logs dir is created. OS watch approach is too complicated for this simple task
            await msleep(1500)
            const content = fs.readFileSync(path.resolve(__dirname, "../../logs/computeSum.log"), "utf-8")
            expect(content).toContain("message: 'Sum result 10'")
        } finally {
            sdk.server.close()
        }
    })
})