// [[file:~/work/papiea-js/Papiea-design.org::*/src/tasks/task_manager_interface.ts][/src/tasks/task_manager_interface.ts:1]]
import { Entity_Reference, Status } from "papiea-core";
import { IntentfulTask } from "./task_interface"
import { timeout } from "../utils/utils"
import { IntentfulTask_DB_Mongo } from "../databases/intentful_task_db_mongo"
import { Spec_DB } from "../databases/spec_db_interface"
import { Status_DB } from "../databases/status_db_interface"
import { Watchlist } from "./watchlist"
import { Handler, IntentfulListener } from "./intentful_listener_interface"
import { IntentfulStatus } from "papiea-core/build/core"

// This should be run in a different process
export class DifferResolver {
    protected readonly intentfulTaskDb: IntentfulTask_DB_Mongo
    protected readonly specDb: Spec_DB
    protected readonly statusDb: Status_DB

    protected watchlist: Watchlist
    private intentfulListener: IntentfulListener

    constructor(taskDb: IntentfulTask_DB_Mongo, specDb: Spec_DB, statusDb: Status_DB, intentfulListener: IntentfulListener, watchlist: Watchlist) {
        this.intentfulTaskDb = taskDb
        this.specDb = specDb
        this.statusDb = statusDb
        this.watchlist = watchlist
        this.intentfulListener = intentfulListener
        this.intentfulListener.onTask = new Handler(this.onTask)
        this.intentfulListener.onStatus = new Handler(this.onStatus)
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
            this.launchTasks()
            this.clearFinishedTasks()
        }
    }

    public clearFinishedTasks() {

    }

    public async launchTasks() {

    }

    public onTask(task: IntentfulTask) {
        const tasks = this.watchlist.filter(entityTasks => entityTasks.entity_id === task.entity_ref.uuid)
        if (tasks.length === 0) {
            this.watchlist.push({
                entity_id: task.entity_ref.uuid,
                tasks: [task]
            })
            task.status = IntentfulStatus.Active
        } else {
            this.watchlist.push({
                entity_id: task.entity_ref.uuid,
                tasks: [task]
            })
        }
    }

    protected onStatus(entity: Entity_Reference, specVersion: number, status: Status) {

    }
}