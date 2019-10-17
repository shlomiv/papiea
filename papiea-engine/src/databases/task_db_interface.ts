import { SortParams } from "../entity/entity_api_impl"
import { Task } from "../tasks/task_interface"
import { Provider, Kind } from "papiea-core"

export interface Task_DB {

    create_task(task: Task): Promise<void>

    list_tasks(fields_map: any, sortParams?: SortParams): Promise<Task[]>

    list_provider_tasks(provider: Provider): Promise<[Kind, Task[]][]>

    list_kind_tasks(kind: Kind): Promise<Task[]>

    get_task(uuid: string): Promise<Task>

    update_task(uuid: string, delta: Partial<Task>): Promise<void>

    delete_task(uuid: string): Promise<void>

}