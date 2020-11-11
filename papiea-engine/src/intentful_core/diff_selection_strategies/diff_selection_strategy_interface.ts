import { Diff } from "papiea-core";

type Index = number

export interface DiffSelectionStrategyInterface {

    // Select a diff and return its index in the original diff list
    selectOne: (diffs: Diff[]) => [Diff, Index]
}
