import { Spec_DB } from "../databases/spec_db_interface"
import { Status_DB } from "../databases/status_db_interface"
import { IntentfulStrategy } from "./intentful_strategies/intentful_strategy_interface"
import {IntentfulBehaviour, Kind, Differ, DiffSelectionStrategy, Provider} from "papiea-core"
import { SpecOnlyIntentfulStrategy } from "./intentful_strategies/spec_only_intentful_strategy"
import { UserAuthInfo } from "../auth/authn"
import { DifferIntentfulStrategy } from "./intentful_strategies/differ_intentful_strategy"
import { IntentWatcher_DB } from "../databases/intent_watcher_db_interface"
import { BasicDiffSelectionStrategy } from "./diff_selection_strategies/basic_diff_selection_strategy";
import { DiffSelectionStrategyInterface } from "./diff_selection_strategies/diff_selection_strategy_interface";
import { RandomDiffSelectionStrategy } from "./diff_selection_strategies/random_diff_selection_strategy";
import { Watchlist_DB } from "../databases/watchlist_db_interface";
import {
    BasicUpdateStrategy, DifferUpdateStrategy,
    SpecOnlyUpdateStrategy,
    StatusUpdateStrategy
} from "./intentful_strategies/status_update_strategy";
import { Graveyard_DB } from "../databases/graveyard_db_interface"
import {EntityCreationStrategy} from "./entity_creation_strategies/entity_creation_strategy_interface"
import {ConstructorEntityCreationStrategy} from "./entity_creation_strategies/constructor_entity_creation_strategy"
import {BasicEntityCreationStrategy} from "./entity_creation_strategies/basic_entity_creation_strategy"
import {Validator} from "../validator"
import {Authorizer, IntentWatcherAuthorizer} from "../auth/authz"

export type BehaviourStrategyMap = Map<IntentfulBehaviour, IntentfulStrategy>
export type DiffSelectionStrategyMap = Map<DiffSelectionStrategy, DiffSelectionStrategyInterface>
export type StatusUpdateStrategyMap = Map<IntentfulBehaviour, StatusUpdateStrategy>
export type EntityCreationStrategyMap = Map<"constructor" | "basic", EntityCreationStrategy>

export class IntentfulContext {
    private readonly behaviourStrategyMap: BehaviourStrategyMap
    private readonly diffSelectionStrategyMap: DiffSelectionStrategyMap
    private readonly statusUpdateStrategyMap: StatusUpdateStrategyMap
    private readonly entityCreationStrategyMap: EntityCreationStrategyMap

    constructor(specDb: Spec_DB, statusDb: Status_DB, graveyardDb: Graveyard_DB, differ: Differ, intentWatcherDb: IntentWatcher_DB, watchlistDb: Watchlist_DB, validator: Validator, authorizer: Authorizer) {
        this.behaviourStrategyMap = new Map()
        this.behaviourStrategyMap.set(IntentfulBehaviour.Basic, new DifferIntentfulStrategy(specDb, statusDb, graveyardDb, differ, intentWatcherDb, watchlistDb))
        this.behaviourStrategyMap.set(IntentfulBehaviour.SpecOnly, new SpecOnlyIntentfulStrategy(specDb, statusDb, graveyardDb))
        this.behaviourStrategyMap.set(IntentfulBehaviour.Differ, new DifferIntentfulStrategy(specDb, statusDb, graveyardDb, differ, intentWatcherDb, watchlistDb))

        this.diffSelectionStrategyMap = new Map()
        this.diffSelectionStrategyMap.set(DiffSelectionStrategy.Basic, new BasicDiffSelectionStrategy())
        this.diffSelectionStrategyMap.set(DiffSelectionStrategy.Random, new RandomDiffSelectionStrategy())

        this.statusUpdateStrategyMap = new Map()
        this.statusUpdateStrategyMap.set(IntentfulBehaviour.Basic, new BasicUpdateStrategy(statusDb))
        this.statusUpdateStrategyMap.set(IntentfulBehaviour.SpecOnly, new SpecOnlyUpdateStrategy(statusDb))
        this.statusUpdateStrategyMap.set(IntentfulBehaviour.Differ, new DifferUpdateStrategy(statusDb, specDb, differ, watchlistDb))

        this.entityCreationStrategyMap = new Map()
        this.entityCreationStrategyMap.set("constructor", new ConstructorEntityCreationStrategy(specDb, statusDb, graveyardDb, watchlistDb, validator, authorizer, differ, intentWatcherDb))
        this.entityCreationStrategyMap.set("basic", new BasicEntityCreationStrategy(specDb, statusDb, graveyardDb, watchlistDb, validator, authorizer))
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

    getDiffSelectionStrategy(kind: Kind): DiffSelectionStrategyInterface {
        const strategy = this.diffSelectionStrategyMap.get(kind.diff_selection_strategy || DiffSelectionStrategy.Random)
        return strategy!
    }

    getStatusUpdateStrategy(kind: Kind, user: UserAuthInfo): StatusUpdateStrategy {
        const strategy = this.statusUpdateStrategyMap.get(kind.kind_structure[kind.name]['x-papiea-entity'])
        if (strategy === undefined) {
            throw new Error(`Strategy associated with behaviour: ${kind.intentful_behaviour} not found`)
        }
        strategy.setKind(kind)
        strategy.setUser(user)
        return strategy
    }

    getEntityCreationStrategy(provider: Provider, kind: Kind, user: UserAuthInfo): EntityCreationStrategy {
        let strategy: EntityCreationStrategy | undefined
        if (kind.kind_procedures[`__${ kind.name }_create`] !== null && kind.kind_procedures[`__${ kind.name }_create`] !== undefined) {
            strategy = this.entityCreationStrategyMap.get("constructor")
        } else {
            strategy = this.entityCreationStrategyMap.get("basic")
        }
        strategy?.setKind(kind)
        strategy?.setUser(user)
        strategy?.setProvider(provider)
        return strategy!
    }
}
