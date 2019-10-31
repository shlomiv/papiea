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
import { SFSCompiler } from "../intentful_core/sfs_compiler"

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
            this.clearFinishedTasks()
        }
    }

    public clearFinishedTasks() {

    }

    public async onTask(task: IntentfulTask) {
        const tasks = this.watchlist.filter(entityTasks => entityTasks.entity_id === task.entity_ref.uuid)
        if (tasks.length === 0) {
            this.watchlist.push({
                entity_id: task.entity_ref.uuid,
                tasks: [task]
            })
            task.status = IntentfulStatus.Active
            await this.intentfulTaskDb.update_task(task.uuid, task)
            // TODO: start the handler and assign
        } else {
            this.watchlist.push({
                entity_id: task.entity_ref.uuid,
                tasks: [task]
            })
        }
    }

    protected async onStatus(entity: Entity_Reference, specVersion: number, status: Status) {
        const [metadata, spec] = await this.specDb.get_spec(entity)
        const tasks = this.watchlist.filter(entityTasks => entityTasks.entity_id === entity.uuid)
        if (tasks.length !== 0) {
            const activeTasks = tasks[0].tasks.filter(task => task.status === IntentfulStatus.Active)
            if (activeTasks.length === 0) {
                return
            } else if (activeTasks.length > 1) {
                // TODO: This should be configurable via strategy
                throw new Error(`There can not be more than one task running for entity with uuid: ${entity.uuid}`)
            }
            const activeTask = activeTasks[0]
            if (metadata.spec_version >= activeTask.spec_version) {
                activeTask.status = IntentfulStatus.Outdated
                await this.intentfulTaskDb.update_task(activeTask.uuid, activeTask)
            } else {
                const diffs = activeTask.diffs.filter(diff => {
                    return SFSCompiler.run_sfs(diff.intentful_signature.compiled_signature, spec, status).length !== 0;
                })
                if (diffs.length === 0) {
                    activeTask.status = IntentfulStatus.Completed_Successfully
                    await this.intentfulTaskDb.update_task(activeTask.uuid, activeTask)
                }
            }
        }
    }
}