import { Status, Spec } from "papiea-core"
import { EntryReference } from "./watchlist";

export class Handler<T extends Function> {
    _fn: T | null

    constructor(_fn?: T) {
        if (_fn === undefined) {
            this._fn = null
        } else {
            this._fn = _fn
        }
    }

    set handle(fn: T) {
        this._fn = fn
    }

    async call(...args: any[]) {
        try {
            if (this._fn === null) {
                throw new Error("Function for handling is not defined")
            } else {
                await this._fn.apply(this, args)
            }
        } catch (e) {
            console.error(e)
            throw e
        }
    }
}

export interface IntentfulListener {
    onSpec: Handler<(entity: EntryReference, specVersion: number, spec: Spec) => Promise<void>>

    onStatus: Handler<(entity: EntryReference, status: Status) => Promise<void>>

    run(delay: number): Promise<void>
}