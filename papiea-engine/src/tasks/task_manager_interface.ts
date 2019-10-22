// [[file:~/work/papiea-js/Papiea-design.org::*/src/tasks/task_manager_interface.ts][/src/tasks/task_manager_interface.ts:1]]
import { Diff, Entity_Reference, Kind, Spec } from "papiea-core";
import { Papiea } from "../papiea";
import { Task_DB_Mongo } from "../databases/task_db_mongo"
import { Task } from "./task_interface"
import { timeout } from "../utils/utils"

class TaskSet {
    taskMap: Map<string, Task>
    taskSet: Set<Task>

    constructor() {
        this.taskMap = new Map()
        this.taskSet = new Set()
    }

    [Symbol.iterator]() {
        return this.values
    }

    add(task: Task) {
        this.taskMap.set(task.uuid, task)
        this.taskSet.add(task)
    }

    has(task: Task) {
        return this.taskMap.has(task.uuid)
    }

    values() {
        return this.taskSet.values()
    }

    delete(task: Task) {
        this.taskMap.delete(task.uuid)
        this.taskSet.delete(task)
    }
}

// This should be run in a different process
export class TaskManager {
    // This should be a separate connection from main Papiea functions
    protected taskDb: Task_DB_Mongo

    protected _running: TaskSet
    protected _waiting: TaskSet

    constructor(taskDb: Task_DB_Mongo) {
        this.taskDb = taskDb
        this._running = new TaskSet()
        this._waiting = new TaskSet()
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
            this.sortTasks()
        }
    }

    protected sortTasks() {

    }

    public launchTask() {

    }

    protected async gatherTasks() {
        const tasks = await this.taskDb.list_tasks({})
        tasks.forEach((task) => {
            if (!this._waiting.has(task) && !this._running.has(task)) {
                this._waiting.add(task)
            }
        })
    }
}

// [[file:~/work/papiea-js/Papiea-design.org::#h-Interface-766][task-manager-interface]]
// export interface Task {
//     wait():any;
//     register_delta(diffs: Diff[]):boolean;
// }
//
// export interface Task_Creator {
//     new_task (): Task;
//     new_intentful_task (papiea: Papiea, entity: Entity_Reference, kind: Kind, spec: Spec): Task;
// }
//
// export interface Task_Manager {
// // Not yet defined..
// }

// task-manager-interface ends here
// /src/tasks/task_manager_interface.ts:1 ends here
