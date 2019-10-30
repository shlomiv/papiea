import { Entity_Reference } from "papiea-core"
import { IntentfulTask } from "./task_interface"

export type Watchlist = EntityTasks[]

export interface EntityTasks {
    entity_id: string,
    tasks: IntentfulTask[]
}