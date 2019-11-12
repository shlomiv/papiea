import { SFSCompiler } from "../../src/intentful_core/sfs_compiler"
import { getLocationDataDescription } from "../test_data_factory"

describe("SFS Compiler Tests", () => {
    const locationDataDescription = getLocationDataDescription()
    const name = Object.keys(locationDataDescription)[0]

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
})