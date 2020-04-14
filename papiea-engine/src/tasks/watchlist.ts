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

export type SerializedWatchlist = { [key: string]: [EntryReference, Diff | undefined, Delay | undefined] }

export class Watchlist {
    private _entries: SerializedWatchlist

    constructor(watchlist?: SerializedWatchlist) {
        this._entries = watchlist ?? {}
    }


    get(uuid: string): [EntryReference, Diff | undefined, Delay | undefined] | undefined {
        return this._entries[uuid]
    }

    set(uuid: string, value: [EntryReference, (Diff | undefined), (Delay | undefined)]): this {
        this._entries[uuid] = value
        return this
    }

    delete(uuid: string): boolean {
        let exists: boolean
        if (this._entries[uuid]) {
            exists = true
        } else {
            exists = false
        }
        delete this._entries[uuid]
        return exists
    }

    update(watchlist: Watchlist) {
        this._entries = watchlist._entries
    }

    serialize(): SerializedWatchlist {
        return this._entries
    }

    entries(): SerializedWatchlist {
        return this._entries
    }

    has(uuid: string): boolean {
        const item = this._entries[uuid]
        return item !== undefined;
    }

    entry_uuids(): string[] {
        return Object.keys(this._entries)
    }
}