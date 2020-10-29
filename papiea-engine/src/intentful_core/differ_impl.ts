import { Spec, Status, Kind, Differ, Diff } from "papiea-core"
import { SFSCompiler } from "./sfs_compiler"

export interface DiffContent {
    keys: any,
    key: string,
    path: Array<number | string>,
    spec: number[] | string[],
    status: number[] | string[]
}

export class BasicDiffer implements Differ {
    // Get the diff iterator from an entity based on the
    public* diffs(kind: Kind, spec: Spec, status: Status): Generator<Diff, any, undefined> {
        for (let sig of kind.intentful_signatures) {
            const compiled_signature = SFSCompiler.try_compile_sfs(sig.signature, kind.name)
            const result = SFSCompiler.run_sfs(compiled_signature, spec, status)
            if (result != null && result.length > 0) {
                yield {
                    kind: kind.name,
                    intentful_signature: sig,
                    diff_fields: SFSCompiler.run_sfs(compiled_signature, spec, status)
                }
            }
        }
    }

    // We could also get the entire list of diffs, ordered by the
    // original dependency tree
    public all_diffs(kind: Kind, spec: Spec, status: Status): Diff[] {
        return kind.intentful_signatures.map(sig => {
                const compiled_signature = SFSCompiler.try_compile_sfs(sig.signature, kind.name)
                const diff_fields = SFSCompiler.run_sfs(compiled_signature, spec, status)
                return {
                    kind: kind.name,
                    intentful_signature: sig,
                    diff_fields: diff_fields
                }
            }
        ).filter(diff => diff.diff_fields !== null && diff.diff_fields.length > 0)
    }

    public get_diff_path_value(diff: DiffContent, spec: Spec) {
        // This depends keys and diff.path values to be in order
        const keys = Object.keys(diff.keys)
        const arrayItem = (arr: any[], key: string, value: any) => {
            const result = arr.filter(val => val[key] === value)
            if (result[0] !== undefined) {
                return result
            } else {
                throw new Error("Couldn't correctly traverse diff path")
            }
        }
        let obj = spec
        let key_index = 0
        for (let item of diff.path) {
            switch (typeof item) {
                case "number":
                    obj = arrayItem(obj, keys[key_index], item)
                    key_index++
                    break
                case "string":
                    obj = obj[item]
                    break
                default:
                    throw new Error("Unsupported type while traversing diff path")
            }
        }
        return obj
    }
}
