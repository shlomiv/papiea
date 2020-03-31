import { Spec_DB } from "../databases/spec_db_interface"
import { Status_DB } from "../databases/status_db_interface"
import { IntentfulStrategy } from "./intentful_strategy_interface"
import { BasicIntentfulStrategy } from "./basic_intentful_strategy"
import { IntentfulBehaviour, Kind, Differ } from "papiea-core"
import { SpecOnlyIntentfulStrategy } from "./spec_only_intentful_strategy"
import { UserAuthInfo } from "../auth/authn"
import { DifferIntentfulStrategy } from "./differ_intentful_strategy"
import { IntentfulTask_DB } from "../databases/intentful_task_db_interface"
import {
    BasicUpdateStrategy,
    DifferUpdateStrategy,
    SpecOnlyUpdateStrategy,
    StatusUpdateStrategy
} from "./status_update_strategy";

export type BehaviourStrategyMap = Map<IntentfulBehaviour, IntentfulStrategy>
export type StatusUpdateStrategyMap = Map<IntentfulBehaviour, StatusUpdateStrategy>

export class IntentfulContext {
    private readonly specDb: Spec_DB
    private readonly statusDb: Status_DB
    private readonly behaviourStrategyMap: BehaviourStrategyMap
    private readonly statusUpdateStrategyMap: StatusUpdateStrategyMap

    constructor(specDb: Spec_DB, statusDb: Status_DB, differ: Differ, intentfulTaskDb: IntentfulTask_DB) {
        this.specDb = specDb
        this.statusDb = statusDb
        this.behaviourStrategyMap = new Map<IntentfulBehaviour, IntentfulStrategy>()
        this.behaviourStrategyMap.set(IntentfulBehaviour.Basic, new BasicIntentfulStrategy(specDb, statusDb))
        this.behaviourStrategyMap.set(IntentfulBehaviour.SpecOnly, new SpecOnlyIntentfulStrategy(specDb, statusDb))
        this.behaviourStrategyMap.set(IntentfulBehaviour.Differ, new DifferIntentfulStrategy(specDb, statusDb, differ, intentfulTaskDb))
        this.statusUpdateStrategyMap = new Map<IntentfulBehaviour, StatusUpdateStrategy>()
        this.statusUpdateStrategyMap.set(IntentfulBehaviour.Basic, new BasicUpdateStrategy(statusDb))
        this.statusUpdateStrategyMap.set(IntentfulBehaviour.SpecOnly, new SpecOnlyUpdateStrategy(statusDb))
        this.statusUpdateStrategyMap.set(IntentfulBehaviour.Differ, new DifferUpdateStrategy(statusDb, specDb, differ, intentfulTaskDb))
    }

    getIntentfulStrategy(kind: Kind, user: UserAuthInfo): IntentfulStrategy {
        const strategy = this.behaviourStrategyMap.get(kind.intentful_behaviour)
        if (strategy === undefined) {
            throw new Error(`Strategy associated with behaviour: ${kind.intentful_behaviour} not found`)
        }
        strategy.setKind(kind)
        strategy.setUser(user)
        return strategy
    }

    getStatusUpdateStrategy(kind: Kind, user: UserAuthInfo): StatusUpdateStrategy {
        // maybe use that kind.kind_structure[kind.name]['x-papiea-entity'] === IntentfulBehaviour.SpecOnly
        const strategy = this.statusUpdateStrategyMap.get(kind.intentful_behaviour)
        if (strategy === undefined) {
            throw new Error(`Strategy associated with behaviour: ${kind.intentful_behaviour} not found`)
        }
        strategy.setKind(kind)
        strategy.setUser(user)
        return strategy
    }
}