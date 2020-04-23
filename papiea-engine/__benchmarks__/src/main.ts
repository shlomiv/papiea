import { cleanUpTestProvider, setUpTestProvider } from "./test_data";
import { CrudBenchmarks } from "./database_operations/crud";

const args = process.argv
const PAPIEA_URL = args[2]

async function main() {
    const provider = await setUpTestProvider()
    const kind_name = provider.kinds[0].name
    try {
        const crud_benchmarks = new CrudBenchmarks(PAPIEA_URL, provider.prefix, provider.version, kind_name)
        crud_benchmarks.setOpts({ connections: 10, pipelining: 10, duration: 10 })
        await crud_benchmarks.runCreate()
        await crud_benchmarks.runRead()
        await crud_benchmarks.runUpdate()
        await crud_benchmarks.runDelete()
    } finally {
        console.log("Invoking cleanup")
        await cleanUpTestProvider(provider)
    }
}

main().then().catch(console.log)