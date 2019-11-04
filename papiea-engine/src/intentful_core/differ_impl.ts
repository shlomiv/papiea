import { Spec, Status, Kind, Differ, Diff } from "papiea-core";
import { SFSCompiler } from "./sfs_compiler"

export class BasicDiffer implements Differ {
    // Get the diff iterator from an entity based on the
    public *diffs(kind: Kind, spec: Spec, status: Status): Generator<Diff, any, undefined> {
        for (let sig of kind.intentful_signatures) {
            if (SFSCompiler.run_sfs(sig.compiled_signature, spec, status).length !== 0) {
                yield {
                    kind: kind.name,
                    intentful_signature: sig,
                    diff_fields: SFSCompiler.run_sfs(sig.compiled_signature, spec, status)
                }
            }
        }
    }

    // We could also get the entire list of diffs, ordered by the
    // original dependency tree
    public all_diffs(kind: Kind, spec: Spec, status: Status): Diff[] {
        return kind.intentful_signatures.map(sig => {
            return {
                kind: kind.name,
                intentful_signature: sig,
                diff_fields: SFSCompiler.run_sfs(sig.compiled_signature, spec, status)
            }
        }).filter(diff => diff.diff_fields.length !== 0)
    }
}