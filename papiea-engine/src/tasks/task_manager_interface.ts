// [[file:~/work/papiea-js/Papiea-design.org::*/src/tasks/task_manager_interface.ts][/src/tasks/task_manager_interface.ts:1]]
import { Diff, Entity_Reference, Kind, Spec } from "papiea-core";
import { Papiea } from "../papiea";
import { IntentfulTask } from "./task_interface"
import { timeout } from "../utils/utils"
import { IntentfulTask_DB_Mongo } from "../databases/intentful_task_db_mongo"
import { Entity, IntentfulStatus } from "papiea-core"
import Queue from "mnemonist/queue"
import axios from "axios"
import { Spec_DB } from "../databases/spec_db_interface"
import { Status_DB } from "../databases/status_db_interface"

class IntentfulTaskSet extends Set<IntentfulTask> {
    get(task: IntentfulTask): IntentfulTask | null {
        for (let item of this) {
            if (item.uuid === task.uuid) {
                return item
            }
        }
        return null
    }
}


class IntentfulTaskQueue extends Queue<IntentfulTask> {
    get(task: IntentfulTask): IntentfulTask | null {
        for (let item of this) {
            if (item.uuid === task.uuid) {
                return item
            }
        }
        return null
    }
}

// This should be run in a different process
// TODO: provide optimized Data Structures
// TODO: change it to something more 'intentful'
export class TaskManager {
    // This should be a separate connection from main Papiea functions
    protected readonly intentfulTaskDb: IntentfulTask_DB_Mongo
    protected readonly specDb: Spec_DB
    protected readonly statusDb: Status_DB

    protected _entitiesInProgress: Map<string, Entity_Reference>

    protected _running: IntentfulTaskSet
    protected _waiting: IntentfulTaskQueue

    constructor(taskDb: IntentfulTask_DB_Mongo, specDb: Spec_DB, statusDb: Status_DB) {
        this.intentfulTaskDb = taskDb
        this.specDb = specDb
        this.statusDb = statusDb
        this._running = new IntentfulTaskSet()
        this._waiting = new IntentfulTaskQueue()
        this._entitiesInProgress = new Map<string, Entity_Reference>()
    }

    public async run(delay: number) {
        try {
            await this._run(delay)
        } catch (e) {
            throw e
        }
    }

    private async _run(delay: number) {
        while (true) {
            await timeout(delay)
            this.gatherTasks()
            this.launchTasks()
            this.clearFinishedTasks()
        }
    }

    public clearFinishedTasks() {
        for (let task of this._running) {
            if (task.status === IntentfulStatus.Completed_Successfully || task.status === IntentfulStatus.Failed) {
                this._running.delete(task)
                this._entitiesInProgress.delete(task.entity_ref.uuid)
            }
        }
    }

    public async launchTasks() {
        const task: IntentfulTask | undefined = this._waiting.dequeue()
        if (task) {
            if (!this._entitiesInProgress.has(task.entity_ref.uuid)) {
                this._running.add(task)
                const [metadata, spec] = await this.specDb.get_spec(task.entity_ref)
                const status = await this.statusDb.get_status(task.entity_ref)
                await axios.post(task.handler_url, {
                    metadata: metadata,
                    spec: spec,
                    status: status,
                    input: task.diff.diff_fields
                })
                this._entitiesInProgress.set(task.entity_ref.uuid, task.entity_ref)
            } else {
                this._waiting.enqueue(task)
            }
        }
    }

    protected async gatherTasks() {
        let tasks = await this.intentfulTaskDb.list_tasks({})
        tasks.forEach((task) => {
            const waiting = this._waiting.get(task)
            const running = this._running.get(task)
            if (waiting === null && running === null && (task.status === IntentfulStatus.Completed_Successfully || task.status === IntentfulStatus.Failed)) {
                this._waiting.enqueue(task)
            }
            if (waiting !== null) {
                waiting.status = task.status
            }
            if (running !== null) {
                running.status = task.status
            }
        })
    }
}
// Successful
// U


// [[file:~/work/papiea-js/Papiea-design.org::#h-Interface-766][task-manager-interface]]
// export interface IntentfulTask {
//     wait():any;
//     register_delta(diffs: Diff[]):boolean;
// }
//
// export interface Task_Creator {
//     new_task (): IntentfulTask;
//     new_intentful_task (papiea: Papiea, entity: Entity_Reference, kind: Kind, spec: Spec): IntentfulTask;
// }
//
// export interface Task_Manager {
// // Not yet defined..
// }

// task-manager-interface ends here
// /src/tasks/task_manager_interface.ts:1 ends here
