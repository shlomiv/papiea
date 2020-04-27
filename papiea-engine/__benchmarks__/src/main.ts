import { cleanUpTestProvider, setUpTestProvider } from "./test_data";
import { CrudBenchmarks } from "./database_operations/crud";
import { ProcedureBenchmarks } from "./database_operations/procedures";
import { IntentfulBenchmarks } from "./intentful_operations/intentful";

const args = process.argv
const PAPIEA_URL = args[2]
const PUBLIC_HOST = args[3]
const PUBLIC_PORT = args[4]

async function main() {
    const provider = await setUpTestProvider(PAPIEA_URL, PUBLIC_HOST, PUBLIC_PORT)
    const kind_name = provider.kinds[0].name
    try {
        const crud_benchmarks = new CrudBenchmarks(PAPIEA_URL, provider.prefix, provider.version, kind_name)
        crud_benchmarks.setOpts({ connections: 10, pipelining: 10, duration: 10 })
        await crud_benchmarks.runCreate()
        await crud_benchmarks.runRead()
        await crud_benchmarks.runUpdate()
        await crud_benchmarks.runDelete()

        const procedure_benchmarks = new ProcedureBenchmarks(PAPIEA_URL, provider.prefix, provider.version, kind_name)
        procedure_benchmarks.setOpts({ connections: 10, pipelining: 10, duration: 10 })
        const entity_procedure = Object.keys(provider.kinds[0].entity_procedures)[0]
        const kind_procedure = Object.keys(provider.kinds[0].kind_procedures)[0]
        const provider_procedure = Object.keys(provider.procedures)[0]
        await procedure_benchmarks.runEntityProcedure(entity_procedure)
        await procedure_benchmarks.runKindProcedure(kind_procedure)
        await procedure_benchmarks.runProviderProcedure(provider_procedure)

        const intentful_benchmarks = new IntentfulBenchmarks(PAPIEA_URL, provider.prefix, provider.version, kind_name)
        intentful_benchmarks.setOpts({ amount: 2 })
        await intentful_benchmarks.runIntentfulCAS()
        await intentful_benchmarks.runIntentfulTask()
    } finally {
        console.log("Invoking cleanup")
        await cleanUpTestProvider(provider)
    }
}

main().then().catch(console.log)