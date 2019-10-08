import { Spec, Status, Kind, Differ, Diff } from "papiea-core";

export class BasicDiffer implements Differ {
    // Get the diff iterator from an entity based on the
    public *diffs(kind: Kind, spec: Spec, status: Status): Iterator<Diff> {
        let diff = null;
        let i = 0;
        while (diff === null) {
            diff = Function(kind.intentful_signatures[i].compiled_signature)(spec, status)
            i++
            if (diff !== null) {
                yield diff
            }
        }
    }

    // We could also get the entire list of diffs, ordered by the
    // original dependency tree
    public all_diffs(kind: Kind, spec: Spec, status: Status): Diff[] {
        return kind.intentful_signatures.map(sig => Function(sig.compiled_signature)(spec, status)).filter(diff => diff !== null)
    }
}