import { DiffSelectionStrategyInterface } from "./diff_selection_strategy_interface";
import { Diff } from "papiea-core";
import * as assert from "assert";

export class BasicDiffSelectionStrategy implements DiffSelectionStrategyInterface{

    selectOne(diffs: Diff[]): Diff {
        assert(diffs.length !== 0)
        return diffs[0]
    }
}