import { Entity_Reference } from "papiea-core"
import { IntentfulTask } from "./task_interface"

// TODO: make this an extension of the array to include functions like 'remove'
export type Watchlist = EntityTasks[]

export interface EntityTasks {
    entity_id: string,
    tasks: IntentfulTask[]
}