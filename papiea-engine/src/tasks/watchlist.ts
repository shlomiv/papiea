import { Entity_Reference } from "papiea-core"
import { IntentfulTask } from "./task_interface"
import { Map, Set } from "immutable"
import { IntentfulStatus } from "papiea-core/build/core";
import axios from "axios";

export class Watchlist {
    watchlist: Map<string, Set<IntentfulTask>>

    constructor(watchlist: Map<string, Set<IntentfulTask>>) {
        this.watchlist = watchlist
    }

    get tasks() {
        return this.watchlist.valueSeq().flatten(true).toSet()
    }

    get entity_tasks() {
        return this.watchlist.asMutable().valueSeq().toSet()
    }

    insert_task(task: IntentfulTask) {
        this.watchlist.updateIn([task.entity_ref.uuid], Set(), (tasks: Set<IntentfulTask>) => tasks.add(task))
    }
}

export interface EntityTasks {
    entity_id: string,
    tasks: IntentfulTask[]
}