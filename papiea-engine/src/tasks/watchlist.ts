import { Diff, Entity_Reference, Version } from "papiea-core"

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

export type SerializedWatchlist = { [key: string]: [Diff | undefined, Delay | undefined] }

export class Watchlist {
    private readonly _entries: SerializedWatchlist

    constructor(watchlist?: SerializedWatchlist) {
        this._entries = watchlist ?? {}
    }


    get(key: EntryReference): [Diff | undefined, Delay | undefined] | undefined {
        const json_key = JSON.stringify(key)
        return this._entries[json_key]
    }

    set(key: EntryReference, value: [(Diff | undefined), (Delay | undefined)]): this {
        const json_key = JSON.stringify(key)
        this._entries[json_key] = value
        return this
    }

    delete(key: EntryReference): boolean {
        const json_key = JSON.stringify(key)
        let exists: boolean
        if (this._entries[json_key]) {
            exists = true
        } else {
            exists = false
        }
        delete this._entries[json_key]
        return exists
    }

    serialize(): SerializedWatchlist {
        return this._entries
    }

    entries(): [string, [(Diff | undefined), (Delay | undefined)]][] {
        return Object.entries(this._entries)
    }
}