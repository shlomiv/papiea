import { Diff } from "papiea-core";

export interface DiffSelectionStrategyInterface {
    selectOne: (diffs: Diff[]) => Diff
}