import { uuid4, Diff, Entity } from "papiea-core"

// The task is started by a dedicated scheduler
export interface IntentfulTask {

    // Identifier by which provider can change status of the task & user can monitor the execution
    uuid: uuid4

    // Entity being modified by a task
    entity: Entity

    // Diff resolved by this task
    diff: Diff

    // provider handler url, serves as an identifier for a type of task being executed
    handler_url: string

    // Running, Idle, Error, etc.
    // TODO: Shlomi please design a state machine for this
    status: string

    // A uri for a URL which specifically identifies the currently running process.
    // If the URL returns 404 we know that the task was dropped (say, provider crashed).
    // It will use the specific node's IP and not a load balancer IP.
    // This will direct us to the exact location where the task is running.
    executor_uri?: string

    created_at?: Date
}