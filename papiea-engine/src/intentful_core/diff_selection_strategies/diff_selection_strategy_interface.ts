import { Diff } from "papiea-core";

type Index = number

export interface DiffSelectionStrategyInterface {
    selectOne: (diffs: Diff[]) => [Diff, Index]
}
