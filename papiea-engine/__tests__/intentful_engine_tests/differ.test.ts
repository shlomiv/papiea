import { SFSCompiler } from "../../src/intentful_core/sfs_compiler"
import { getLocationDataDescription, ProviderBuilder } from "../test_data_factory"
import { Provider, IntentfulBehaviour, Procedural_Signature } from "papiea-core"
import { plural } from "pluralize"
import { BasicDiffer } from "../../src/intentful_core/differ_impl"

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
            procedural_signature: {} as Procedural_Signature
        }, {
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

    test("Differ find single diff", () => {
        expect.assertions(1)
        const differ = new BasicDiffer()
        const spec = {
            "a": [{ "id": 1, "a": 1, "d": 2 },
                { "id": 2, "a": 1, "d": 2 }]
        }
        const status = {
            "a": [{ "id": 1, "a": 2, "d": 3 },
                { "id": 2, "a": 1, "d": 3 }]
        }
        const diff_fields = SFSCompiler.run_sfs(SFSCompiler.compile_sfs("a.{id}.[a,d]"), spec, status)
        for (let diff of differ.diffs(locationDifferKind, spec, status)) {
            expect(diff.diff_fields).toEqual(diff_fields)
        }
    })

    test("Differ find 'x' as diff", () => {
        expect.assertions(1)
        const differ = new BasicDiffer()
        const spec = {
            "x": 10,
            "y": 11
        }
        const status = {
            "x": 15,
            "y": 11
        }
        const diff_fields = SFSCompiler.run_sfs(SFSCompiler.compile_sfs("x"), spec, status)
        for (let diff of differ.diffs(locationDifferKind, spec, status)) {
            expect(diff.diff_fields).toEqual(diff_fields)
        }
    })

    test("Differ find 'x' and 'y' as diffs", () => {
        expect.assertions(1)
        const differ = new BasicDiffer()
        const spec = {
            "x": 10,
            "y": 12
        }
        const status = {
            "x": 15,
            "y": 20
        }
        let diff_count = 0
        for (let diff of differ.diffs(locationDifferKind, spec, status)) {
            diff_count++
        }
        expect(diff_count).toEqual(2)
    })

    test("Differ find all diffs", () => {
        expect.assertions(1)
        const differ = new BasicDiffer()
        const spec = {
            "x": 10,
            "y": 12
        }
        const status = {
            "x": 15,
            "y": 20
        }
        let diffs = differ.all_diffs(locationDifferKind, spec, status)
        expect(diffs.length).toEqual(2)
    })
})