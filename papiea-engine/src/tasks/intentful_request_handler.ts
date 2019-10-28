import { RedisClient } from "redis"
import { Entity_Reference, Spec, Status } from "papiea-core"
import { IntentfulTask } from "./task_interface"

class Handler<T extends Function> {
    _fn: T | null

    constructor() {
        this._fn = null
    }

    set handle(fn: T) {
        this._fn = fn
    }

    call(...args: any[]) {
        if (this._fn === null) {
            throw new Error("Function for handling is not defined")
        } else {
            this._fn.apply(this, args)
        }
    }
}

export class IntentfulProcessor {
    private readonly redisClient: RedisClient
    protected taskHandler: Handler<(task: IntentfulTask) => void>
    protected statusHandler: Handler<(entity: Entity_Reference, specVersion: number, status: Status) => void>

    static create(redisClient: RedisClient): IntentfulProcessor {
        const handler = new IntentfulProcessor(redisClient)
        handler.redisClient.on("subscribe", (channel, message) => {

            if (channel === "task:spec_change") {
                handler.taskHandler.call(message)
            } else if (channel === "task:status_change") {
                handler.statusHandler.call(message)
            }
        })

        return handler
    }

    constructor(redisClient: RedisClient) {
        this.redisClient = redisClient
        this.taskHandler = new Handler()
        this.statusHandler = new Handler()
    }

    set onTask(fn: (task: IntentfulTask) => void) {
        this.taskHandler.handle = fn
    }

    set onStatus(fn: (entity: Entity_Reference, specVersion: number, status: Status) => void) {
        this.statusHandler.handle = fn
    }

    publishSpec() {

    }
}