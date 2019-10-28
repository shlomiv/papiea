import { uuid4, Diff, Entity_Reference, IntentfulStatus } from "papiea-core"

// The task is started by a dedicated scheduler
export interface IntentfulTask {

    // Identifier by which provider can change status of the task & user can monitor the execution
    uuid: uuid4

    // Entity being modified by a task
    entity_ref: Entity_Reference

    spec_version: number

    // Diff resolved by this task
    diff: Diff[]

    // A uri for a URL which specifically identifies the currently running process.
    // If the URL returns 404 we know that the task was dropped (say, provider crashed).
    // It will use the specific node's IP and not a load balancer IP.
    // This will direct us to the exact location where the task is running.
    // provider handler url with an id to cache the task it is assigned to, serves as an identifier for a type of task being executed
    handler_id?: string[]

    status: IntentfulStatus

    created_at?: Date
}