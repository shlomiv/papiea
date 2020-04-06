import { Diff, Entity_Reference, Version } from "papiea-core"
import { IntentfulTask } from "./task_interface"

// I don't like the provider being necessary here too much, maybe rethink this
export interface EntryReference {
    provider_reference: {
        provider_prefix: string,
        provider_version: Version
    },
    entity_reference: Entity_Reference
}

export interface Delay {
    delaySetTime: Date
    delay_seconds: number
}

export type Watchlist = Map<EntryReference, [Diff | undefined, Delay | undefined]>