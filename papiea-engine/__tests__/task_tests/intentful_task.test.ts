import { getDifferLocationDataDescription, ProviderBuilder } from "../test_data_factory"
import { IntentfulBehaviour, IntentfulStatus } from "papiea-core"
import { plural } from "pluralize"
import axios from "axios"
import { MongoConnection } from "../../src/databases/mongo"
import { Logger } from "../../src/logger_interface"
import { WinstonLogger } from "../../src/logger"
import { IntentfulTask_DB } from "../../src/databases/intentful_task_db_interface"
import { IntentfulTask } from "../../src/tasks/task_interface"
import { Intentful_Execution_Strategy, Metadata, Provider } from "papiea-core"

declare var process: {
    env: {
        SERVER_PORT: string,
        PAPIEA_ADMIN_S2S_KEY: string,
        MONGO_DB: string,
        MONGO_URL: string,
    }
};
const serverPort = parseInt(process.env.SERVER_PORT || '3000');
const adminKey = process.env.PAPIEA_ADMIN_S2S_KEY || '';

const entityApi = axios.create({
    baseURL: `http://127.0.0.1:${serverPort}/services`,
    timeout: 1000,
    headers: { 'Content-Type': 'application/json' }
});

const providerApiAdmin = axios.create({
    baseURL: `http://127.0.0.1:${serverPort}/provider`,
    timeout: 1000,
    headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminKey}`
    }
});

describe("Intentful Task tests", () => {

    const locationDataDescription = getDifferLocationDataDescription()
    const name = Object.keys(locationDataDescription)[0]
    const locationDifferKind = {
        name,
        name_plural: plural(name),
        kind_structure: locationDataDescription,
        intentful_signatures: [{
            signature: "x",
            name: "test",
            argument: {},
            result: {},
            execution_strategy: Intentful_Execution_Strategy.Basic,
            procedure_callback: "",
            base_callback: ""
        }],
        dependency_tree: new Map(),
        kind_procedures: {},
        entity_procedures: {},
        differ: undefined,
        intentful_behaviour: IntentfulBehaviour.Differ
    }

    const locationDifferKindWithMultipleSignatures = {
        name,
        name_plural: plural(name),
        kind_structure: locationDataDescription,
        intentful_signatures: [{
            signature: "x",
            name: "test",
            argument: {},
            result: {},
            execution_strategy: Intentful_Execution_Strategy.Basic,
            procedure_callback: "",
            base_callback: ""
        }, {
            signature: "y",
            name: "test",
            argument: {},
            result: {},
            execution_strategy: Intentful_Execution_Strategy.Basic,
            procedure_callback: "",
            base_callback: ""
        }],
        dependency_tree: new Map(),
        kind_procedures: {},
        entity_procedures: {},
        differ: undefined,
        intentful_behaviour: IntentfulBehaviour.Differ
    }
    const mongoUrl = process.env.MONGO_URL || 'mongodb://mongo:27017';
    const mongoDb = process.env.MONGO_DB || 'papiea';
    const mongoConnection: MongoConnection = new MongoConnection(mongoUrl, mongoDb);
    const intentfulWorkflowTestLogger: Logger = new WinstonLogger("info");
    let intentfulTaskDb: IntentfulTask_DB
    let createdTask: IntentfulTask
    let to_delete_metadata: Metadata
    let provider: Provider

    beforeAll(async () => {
        await mongoConnection.connect(false);
        intentfulTaskDb = await mongoConnection.get_intentful_task_db(intentfulWorkflowTestLogger)
    });

    afterAll(async () => {
        await mongoConnection.close()
    });

    afterEach(async () => {
        await intentfulTaskDb.delete_task(createdTask.uuid)
        await entityApi.delete(`${provider.prefix}/${provider.version}/${to_delete_metadata.kind}/${to_delete_metadata.uuid}`)
        await providerApiAdmin.delete(`${provider.prefix}/${provider.version}`)
    })

    test("Intentful task created through updating the spec", async () => {
        expect.hasAssertions()
        provider = new ProviderBuilder()
            .withVersion("0.1.0")
            .withKinds([locationDifferKind])
            .build()
        await providerApiAdmin.post('/', provider);
        const { data: { metadata, spec } } = await entityApi.post(`/${ provider.prefix }/${ provider.version }/${ locationDifferKind.name }`, {
            spec: {
                x: 10,
                y: 11
            }
        });
        to_delete_metadata = metadata
        const { data: { task } } = await entityApi.put(`/${ provider.prefix }/${ provider.version }/${ locationDifferKind.name }/${ metadata.uuid }`, {
            spec: {
                x: 20,
                y: 11
            },
            metadata: {
                spec_version: 1
            }
        })
        expect(task.status).toEqual(IntentfulStatus.Pending)
        expect(task.diffs[0].diff_fields[0]["spec-val"][0]).toEqual(20)
        expect(task.diffs[0].diff_fields[0]["status-val"][0]).toEqual(10)
        createdTask = task
    })

    test("Intentful task created through updating the spec with multiple diffs", async () => {
        expect.hasAssertions()
        provider = new ProviderBuilder()
            .withVersion("0.1.0")
            .withKinds([locationDifferKindWithMultipleSignatures])
            .build()
        await providerApiAdmin.post('/', provider);
        const { data: { metadata, spec } } = await entityApi.post(`/${ provider.prefix }/${ provider.version }/${ locationDifferKind.name }`, {
            spec: {
                x: 10,
                y: 11
            }
        });
        to_delete_metadata = metadata
        await entityApi.get(`/${ provider.prefix }/${ provider.version }/${ locationDifferKind.name }/${ metadata.uuid }`)
        const { data: { task } } = await entityApi.put(`/${ provider.prefix }/${ provider.version }/${ locationDifferKind.name }/${ metadata.uuid }`, {
            spec: {
                x: 20,
                y: 110
            },
            metadata: {
                spec_version: 1
            }
        })
        expect(task.status).toEqual(IntentfulStatus.Pending)
        expect(task.diffs[0].diff_fields[0]["spec-val"][0]).toEqual(20)
        expect(task.diffs[1].diff_fields[0]["spec-val"][0]).toEqual(110)
        expect(task.diffs[0].diff_fields[0]["status-val"][0]).toEqual(10)
        expect(task.diffs[1].diff_fields[0]["status-val"][0]).toEqual(11)
        createdTask = task
    })

    test("Intentful task created through updating the spec and queried via API", async () => {
        expect.hasAssertions()
        provider = new ProviderBuilder()
            .withVersion("0.1.0")
            .withKinds([locationDifferKind])
            .build()
        await providerApiAdmin.post('/', provider);
        const { data: { metadata, spec } } = await entityApi.post(`/${ provider.prefix }/${ provider.version }/${ locationDifferKind.name }`, {
            spec: {
                x: 10,
                y: 11
            }
        });
        to_delete_metadata = metadata
        const { data: { task } } = await entityApi.put(`/${ provider.prefix }/${ provider.version }/${ locationDifferKind.name }/${ metadata.uuid }`, {
            spec: {
                x: 20,
                y: 11
            },
            metadata: {
                spec_version: 1
            }
        })

        const result = await entityApi.get(`/intentful_task/${ task.uuid }`)
        expect(result.data.status).toEqual(IntentfulStatus.Pending)
        expect(result.data.diffs).toBeUndefined()
        createdTask = task
    })

    test("Intentful task created through updating the spec and queried as list via API", async () => {
        expect.hasAssertions()
        provider = new ProviderBuilder()
            .withVersion("0.1.0")
            .withKinds([locationDifferKind])
            .build()
        await providerApiAdmin.post('/', provider);
        const { data: { metadata, spec } } = await entityApi.post(`/${ provider.prefix }/${ provider.version }/${ locationDifferKind.name }`, {
            spec: {
                x: 10,
                y: 11
            }
        });
        to_delete_metadata = metadata
        const { data: { task } } = await entityApi.put(`/${ provider.prefix }/${ provider.version }/${ locationDifferKind.name }/${ metadata.uuid }`, {
            spec: {
                x: 20,
                y: 11
            },
            metadata: {
                spec_version: 1
            }
        })

        const result = await entityApi.get(`/intentful_task`)
        expect(result.data.results.length).toBeGreaterThanOrEqual(1)
        createdTask = task
    })

    test("Intentful task created through updating the spec and queried as list via POST API", async () => {
        expect.hasAssertions()
        provider = new ProviderBuilder()
            .withVersion("0.1.0")
            .withKinds([locationDifferKind])
            .build()
        await providerApiAdmin.post('/', provider);
        const { data: { metadata, spec } } = await entityApi.post(`/${ provider.prefix }/${ provider.version }/${ locationDifferKind.name }`, {
            spec: {
                x: 10,
                y: 11
            }
        });
        to_delete_metadata = metadata
        const { data: { task } } = await entityApi.put(`/${ provider.prefix }/${ provider.version }/${ locationDifferKind.name }/${ metadata.uuid }`, {
            spec: {
                x: 20,
                y: 11
            },
            metadata: {
                spec_version: 1
            }
        })

        const result = await entityApi.post(`/intentful_task/filter`)
        expect(result.data.results.length).toBeGreaterThanOrEqual(1)
        createdTask = task
    })
})