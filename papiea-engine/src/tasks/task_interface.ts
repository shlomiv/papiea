import { uuid4, Diff, Entity_Reference, IntentfulStatus, Metadata, Spec } from "papiea-core"
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

    // Number of times a handler has failed
    times_failed: number

    // Last handler error message
    last_handler_error?: string

    // Current status of the entity
    status: IntentfulStatus

    last_status_changed?: Date

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
            created_at: intentfulTask.created_at,
            times_failed: intentfulTask.times_failed,
            last_handler_error: intentfulTask.last_handler_error,
        }
    }

    public static filter(
        intentfulTasks: IntentfulTask[], entities: [Metadata, Spec][],
    ): IntentfulTask[] {
        const tasks: IntentfulTask[] = []
        entities.forEach(entity => {
            intentfulTasks.forEach(task => {
                if (entity[0].uuid === task.entity_ref.uuid && !tasks.includes(task)) {
                    tasks.push(task)
                }
            })
        })
        return tasks
    }

    public static toResponses(intentfulTasks: IntentfulTask[]): Partial<IntentfulTask>[] {
        return intentfulTasks.map(task => {
            return {
                uuid: task.uuid,
                entity_ref: task.entity_ref,
                spec_version: task.spec_version,
                status: task.status,
                created_at: task.created_at,
            }
        })
    }
}
