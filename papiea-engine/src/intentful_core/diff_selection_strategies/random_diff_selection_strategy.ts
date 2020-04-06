import { DiffSelectionStrategyInterface } from "./diff_selection_strategy_interface";
import { Diff } from "papiea-core";

export class RandomDiffSelectionStrategy implements DiffSelectionStrategyInterface {

    selectOne(diffs: Diff[]): Diff {
        if (diffs.length === 0) {
            throw new Error("No diffs found")
        }
        return diffs[Math.floor(Math.random() * diffs.length)]
    }
}