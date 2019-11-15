import { getDifferLocationDataDescription, ProviderBuilder } from "../test_data_factory"
import { IntentfulBehaviour, Procedural_Signature, IntentfulStatus } from "papiea-core"
import { plural } from "pluralize"
import axios from "axios"

declare var process: {
    env: {
        SERVER_PORT: string,
        PAPIEA_ADMIN_S2S_KEY: string
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
            procedural_signature: {} as Procedural_Signature
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
            procedural_signature: {} as Procedural_Signature
        }, {
            signature: "y",
            procedural_signature: {} as Procedural_Signature
        }],
        dependency_tree: new Map(),
        kind_procedures: {},
        entity_procedures: {},
        differ: undefined,
        intentful_behaviour: IntentfulBehaviour.Differ
    }

    test("Intentful task created through updating the spec", async () => {
        expect.hasAssertions()
        const provider = new ProviderBuilder()
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
    })

    test("Intentful task created through updating the spec with multiple diffs", async () => {
        expect.hasAssertions()
        const provider = new ProviderBuilder()
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
        const res = await entityApi.get(`/${ provider.prefix }/${ provider.version }/${ locationDifferKind.name }/${ metadata.uuid }`)
        console.log(res.data)
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
    })

    test("Intentful task created through updating the spec and queried via API", async () => {
        expect.hasAssertions()
        const provider = new ProviderBuilder()
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
    })
})