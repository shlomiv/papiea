import { Spec, Status, Kind, Differ, Diff } from "papiea-core"
import { SFSCompiler } from "./sfs_compiler"

export class BasicDiffer implements Differ {
    // Get the diff iterator from an entity based on the
    public* diffs(kind: Kind, spec: Spec, status: Status): Generator<Diff, any, undefined> {
        for (const sig of kind.intentful_signatures) {
            const compiled_signature = SFSCompiler.try_compile_sfs(sig.signature, kind.name)
            if (SFSCompiler.run_sfs(compiled_signature, spec, status) !== null) {
                yield {
                    kind: kind.name,
                    intentful_signature: sig,
                    diff_fields: SFSCompiler.run_sfs(compiled_signature, spec, status),
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
                diff_fields,
            }
        },
        ).filter(diff => diff.diff_fields !== null)
    }
}
