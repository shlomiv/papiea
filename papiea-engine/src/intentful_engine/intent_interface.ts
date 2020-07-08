import { uuid4, Diff, Entity_Reference, IntentfulStatus, Metadata, Spec } from "papiea-core"
import { UserAuthInfo } from "../auth/authn"

// The watcher is started by a dedicated scheduler
export interface IntentWatcher {

    // Identifier by which provider can change status of the watcher & user can monitor the execution
    uuid: uuid4

    // Entity being observed by a watcher
    entity_ref: Entity_Reference

    // Spec version at the time of a spec change
    spec_version: number

    // User who triggered a spec change
    user?: UserAuthInfo

    // Diffs tracked by this watcher
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

export class IntentWatcherMapper {
    public static toResponse(intentWatcher: IntentWatcher): Partial<IntentWatcher> {
        return {
            uuid: intentWatcher.uuid,
            entity_ref: intentWatcher.entity_ref,
            spec_version: intentWatcher.spec_version,
            status: intentWatcher.status,
            created_at: intentWatcher.created_at,
            times_failed: intentWatcher.times_failed,
            last_handler_error: intentWatcher.last_handler_error
        }
    }

    public static filter(intentWatchers: IntentWatcher[], entities: [Metadata, Spec][]): IntentWatcher[] {
        const watchers: IntentWatcher[] = []
        entities.forEach(entity => {
            intentWatchers.forEach(watcher => {
                if (entity[0].uuid === watcher.entity_ref.uuid && !watchers.includes(watcher)) {
                    watchers.push(watcher)
                }
            })
        })
        return watchers
    }

    public static toResponses(intentWatchers: IntentWatcher[]): Partial<IntentWatcher>[] {
        return intentWatchers.map(watcher => {
            return {
                uuid: watcher.uuid,
                entity_ref: watcher.entity_ref,
                spec_version: watcher.spec_version,
                status: watcher.status,
                created_at: watcher.created_at
            }
        })
    }
}
