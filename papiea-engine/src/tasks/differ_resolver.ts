// [[file:~/work/papiea-js/Papiea-design.org::*/src/tasks/task_manager_interface.ts][/src/tasks/task_manager_interface.ts:1]]
import { Entity_Reference, Status, IntentfulStatus } from "papiea-core";
import { IntentfulTask } from "./task_interface"
import { timeout } from "../utils/utils"
import { IntentfulTask_DB_Mongo } from "../databases/intentful_task_db_mongo"
import { Spec_DB } from "../databases/spec_db_interface"
import { Status_DB } from "../databases/status_db_interface"
import { Watchlist } from "./watchlist"
import { Handler, IntentfulListener } from "./intentful_listener_interface"
import { SFSCompiler } from "../intentful_core/sfs_compiler"
import axios from "axios"

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
        this.onTask = this.onTask.bind(this)
        this.onStatus = this.onStatus.bind(this)
        this.intentfulListener.onTask = new Handler(this.onTask)
        this.intentfulListener.onStatus = new Handler(this.onStatus)
    }

    public async run(delay: number) {
        try {
            await this._run(delay)
        } catch (e) {
            console.error(e)
            throw e
        }
    }

    private async _run(delay: number) {
        while (true) {
            await timeout(delay)
            await this.clearFinishedTasks()
        }
    }

    public async activateTask(): Promise<void> {
        for (let entityTask of this.watchlist) {
            let activeTasks = entityTask.tasks.filter(task => task.status === IntentfulStatus.Active)
            let pendingTasks = entityTask.tasks.filter(task => task.status === IntentfulStatus.Pending)
            if (activeTasks.length === 0 && pendingTasks.length > 0) {
                let activeTask = pendingTasks[0]
                activeTask.status = IntentfulStatus.Active
                await this.intentfulTaskDb.update_task(activeTask.uuid, activeTask)
                const [metadata, entitySpec] = await this.specDb.get_spec(activeTask.entity_ref)
                const [_, entityStatus] = await this.statusDb.get_status(activeTask.entity_ref)
                for (let diff of activeTask.diffs) {
                    await axios.post(diff.intentful_signature.procedural_signature.procedure_callback, {
                        metadata: metadata,
                        spec: entitySpec,
                        status: entityStatus,
                        input: diff.diff_fields
                    })
                    // TODO: find the handler id that is executing the procedure
                }
            }
        }
    }

    public async clearFinishedTasks(): Promise<void> {
        const tasks = this.watchlist.reduce((acc: IntentfulTask[], entityTask) => {
            entityTask.tasks.forEach(task => {
                acc.push(task)
            })
            return acc
        }, [])
        for (let task of tasks) {
            if (task.status !== IntentfulStatus.Active && task.status !== IntentfulStatus.Pending) {
                await this.removeTask(task)
            }
        }
    }

    private async removeTask(task: IntentfulTask): Promise<void> {
        for (let entityTasks of this.watchlist) {
            for (let i in entityTasks.tasks) {
                if (entityTasks.tasks[i] === task) {
                    await this.intentfulTaskDb.delete_task(entityTasks.tasks[i].uuid)
                    entityTasks.tasks.splice(Number(i), 1)
                }
            }
        }
    }

    public async onTask(task: IntentfulTask) {
        this.watchlist.push({
            entity_id: task.entity_ref.uuid,
            tasks: [task]
        })
    }

    protected async onStatus(entity: Entity_Reference, specVersion: number, status: Status) {
        await this.activateTask()
        const [metadata, spec] = await this.specDb.get_spec(entity)
        const tasks = this.watchlist.filter(entityTasks => entityTasks.entity_id === entity.uuid)
        if (tasks.length !== 0) {
            const activeTasks = tasks[0].tasks.filter(task => task.status === IntentfulStatus.Active)
            console.log(activeTasks)
            if (activeTasks.length === 0) {
                return
            } else if (activeTasks.length > 1) {
                // TODO: This should be configurable via strategy
                throw new Error(`There can not be more than one task running for entity with uuid: ${entity.uuid}`)
            }
            const activeTask = activeTasks[0]
            const diffs = activeTask.diffs.filter(diff => {
                const compiledSignature = SFSCompiler.compile_sfs(diff.intentful_signature.signature)
                return SFSCompiler.run_sfs(compiledSignature, spec, status) !== null
            })
            console.log(JSON.stringify(diffs))
            if (metadata.spec_version > activeTask.spec_version + 1) {
                if (diffs.length === 0) {
                    activeTask.status = IntentfulStatus.Outdated
                } else if (diffs.length === activeTask.diffs.length) {
                    activeTask.status = IntentfulStatus.Failed
                } else {
                    activeTask.status = IntentfulStatus.Completed_Partially
                }
                await this.intentfulTaskDb.update_task(activeTask.uuid, activeTask)
            } else {
                if (diffs.length === 0) {
                    activeTask.status = IntentfulStatus.Completed_Successfully
                    await this.intentfulTaskDb.update_task(activeTask.uuid, activeTask)
                }
            }
        }
    }
}