import { SortParams } from "../entity/entity_api_impl"
import { IntentWatcher } from "../intents/intent_interface"

export interface IntentWatcher_DB {

    save_task(task: IntentWatcher): Promise<void>

    list_tasks(fields_map: any, sortParams?: SortParams): Promise<IntentWatcher[]>

    get_task(uuid: string): Promise<IntentWatcher>

    update_task(uuid: string, delta: Partial<IntentWatcher>): Promise<void>

    delete_task(uuid: string): Promise<void>
}
