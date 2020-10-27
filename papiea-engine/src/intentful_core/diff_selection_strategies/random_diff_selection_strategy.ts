import { DiffSelectionStrategyInterface } from "./diff_selection_strategy_interface";
import { Diff } from "papiea-core";
import * as assert from "assert";

export class RandomDiffSelectionStrategy implements DiffSelectionStrategyInterface {

    selectOne(diffs: Diff[]): [Diff, number] {
        assert(diffs.filter(diff => diff?.intentful_signature?.procedure_callback).length > 0, "No valid diffs to choose from")
        let diff: Diff | undefined
        let idx: number | undefined
        while (!diff?.intentful_signature?.procedure_callback) {
            idx = Math.floor(Math.random() * diffs.length)
            diff = diffs[idx]
        }
        return [diff, idx!]
    }
}
