import { SFSCompiler } from "../../src/intentful_core/sfs_compiler"
import { getLocationDataDescription, ProviderBuilder } from "../test_data_factory"
import { Provider, IntentfulBehaviour, Procedural_Signature } from "papiea-core"
import { plural } from "pluralize"

describe("SFS Compiler Tests", () => {
    const hostname = '127.0.0.1'
    const port = 9001

    const locationDataDescription = getLocationDataDescription()
    const name = Object.keys(locationDataDescription)[0]
    const locationDifferKind = {
        name,
        name_plural: plural(name),
        kind_structure: locationDataDescription,
        intentful_signatures: [{
            signature: "a.{id}.[a,d]",
            compiled_signature: undefined,
            procedural_signature: {} as Procedural_Signature
        }],
        dependency_tree: new Map(),
        kind_procedures: {},
        entity_procedures: {},
        differ: undefined,
        intentful_behaviour: IntentfulBehaviour.Differ
    }

    test("SFS Compiler compile single signature", () => {
        expect.assertions(1)
        const compiledSignature = SFSCompiler.compile_sfs("a.{id}.[a,d]")
        expect(compiledSignature).not.toBeUndefined()
    })

    test("SFS Compiler run sfs", () => {
        expect.assertions(1)
        const compiledSignature = SFSCompiler.compile_sfs("a.{id}.[a,d]")
        const diffFields = SFSCompiler.run_sfs(compiledSignature, {
                "a": [{ "id": 1, "a": 1, "d": 2 },
                    { "id": 2, "a": 1, "d": 2 }]
            },
            {
                "a": [{ "id": 1, "a": 2, "d": 3 },
                    { "id": 2, "a": 1, "d": 3 }]
            })
        expect(diffFields).toEqual([{
            keys: { id: 1 },
            key: 'a',
            'spec-val': [1],
            'status-val': [2]
        },
            {
                keys: { id: 1 },
                key: 'd',
                'spec-val': [2],
                'status-val': [3]
            }])
    })

    test("SFS Compiler compile kind", () => {
        expect.assertions(2)
        const provider: Provider = new ProviderBuilder()
            .withVersion("0.1.0")
            .withKinds([locationDifferKind])
            .withCallback(`http://${ hostname }:${ port }`)
            .build()

        expect(provider.kinds[0].intentful_signatures[0].compiled_signature).toBeUndefined()
        SFSCompiler.compile_kind(provider.kinds[0])
        expect(provider.kinds[0].intentful_signatures[0].compiled_signature).not.toBeUndefined()
    })

    test("SFS Compiler run compiled kind", () => {
        const provider: Provider = new ProviderBuilder()
            .withVersion("0.1.0")
            .withKinds([locationDifferKind])
            .withCallback(`http://${ hostname }:${ port }`)
            .build()
        SFSCompiler.compile_kind(provider.kinds[0])
        const diff = SFSCompiler.run_sfs(new Function(provider.kinds[0].intentful_signatures[0].compiled_signature), {
                "a": [{ "id": 1, "a": 1, "d": 2 },
                    { "id": 2, "a": 1, "d": 2 }]
            },
            {
                "a": [{ "id": 1, "a": 2, "d": 3 },
                    { "id": 2, "a": 1, "d": 3 }]
            })
    })
})