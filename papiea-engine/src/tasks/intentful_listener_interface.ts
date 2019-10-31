import { IntentfulTask } from "./task_interface"
import { Entity_Reference, Status } from "papiea-core"

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
        if (this._fn === null) {
            throw new Error("Function for handling is not defined")
        } else {
            await this._fn.apply(this, args)
        }
    }
}

export interface IntentfulListener {
    onTask: Handler<(task: IntentfulTask) => Promise<void>>

    onStatus: Handler<(entity: Entity_Reference, specVersion: number, status: Status) => Promise<void>>
}