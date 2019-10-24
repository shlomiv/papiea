// [[file:~/work/papiea-js/Papiea-design.org::*/src/tasks/task_manager_interface.ts][/src/tasks/task_manager_interface.ts:1]]
import { Diff, Entity_Reference, Kind, Spec } from "papiea-core";
import { Papiea } from "../papiea";
import { IntentfulTask } from "./task_interface"
import { timeout } from "../utils/utils"
import { IntentfulTask_DB_Mongo } from "../databases/intentful_task_db_mongo"
import { Entity, IntentfulStatus } from "papiea-core"
import Queue from "mnemonist/queue"
import axios from "axios"

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
export class TaskManager {
    // This should be a separate connection from main Papiea functions
    protected readonly intentfulTaskDb: IntentfulTask_DB_Mongo

    protected _entitiesInProgress: Map<string, Entity>

    protected _running: IntentfulTaskSet
    protected _waiting: IntentfulTaskQueue

    constructor(taskDb: IntentfulTask_DB_Mongo) {
        this.intentfulTaskDb = taskDb
        this._running = new IntentfulTaskSet()
        this._waiting = new IntentfulTaskQueue()
        this._entitiesInProgress = new Map<string, Entity>()
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
                this._entitiesInProgress.delete(task.entity.metadata.uuid)
            }
        }
    }

    public async launchTasks() {
        const task: IntentfulTask | undefined = this._waiting.dequeue()
        if (task) {
            if (!this._entitiesInProgress.has(task.entity.metadata.uuid)) {
                this._running.add(task)
                await axios.post(task.handler_url, {
                    metadata: task.entity.metadata,
                    spec: task.entity.spec,
                    status: task.entity.status,
                    input: task.diff.diff_fields
                })
                this._entitiesInProgress.set(task.entity.metadata.uuid, task.entity)
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
