import { uuid4, Diff, Entity_Reference, IntentfulStatus } from "papiea-core"
import { UserAuthInfo } from "../auth/authn"

// The task is started by a dedicated scheduler
export interface IntentfulTask {

    // Identifier by which provider can change status of the task & user can monitor the execution
    uuid: uuid4

    // Entity being modified by a task
    entity_ref: Entity_Reference

    // Spec version at the time of a spec change
    spec_version: number

    // User who triggered a spec change
    user?: UserAuthInfo

    // Diff resolved by this task
    diffs: Diff[]

    // A uri for a URL which specifically identifies the currently running process.
    // If the URL returns 404 we know that the task was dropped (say, provider crashed).
    // It will use the specific node's IP and not a load balancer IP.
    // This will direct us to the exact location where the task is running.
    // provider handler url with an id to cache the task it is assigned to, serves as an identifier for a type of task being executed
    handler_id?: string[]

    // Current status of the entity
    status: IntentfulStatus

    // Date of creation
    created_at?: Date
}

export class IntentfulTaskMapper {
    public static toResponse(intentfulTask: IntentfulTask): Partial<IntentfulTask> {
        return {
            uuid: intentfulTask.uuid,
            entity_ref: intentfulTask.entity_ref,
            spec_version: intentfulTask.spec_version,
            status: intentfulTask.status,
            created_at: intentfulTask.created_at
        }
    }

    public static toResponses(intentfulTasks: IntentfulTask[]): Partial<IntentfulTask>[] {
        return intentfulTasks.map(task => {
            return {
                uuid: task.uuid,
                entity_ref: task.entity_ref,
                spec_version: task.spec_version,
                status: task.status,
                created_at: task.created_at
            }
        })
    }
}