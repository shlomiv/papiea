import { Entity } from "papiea-core"

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
    onChange: Handler<(entity: Entity) => Promise<void>>

    run(delay: number): Promise<void>
}