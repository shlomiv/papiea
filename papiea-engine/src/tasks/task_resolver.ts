import { Spec_DB } from "../databases/spec_db_interface";
import { Status_DB } from "../databases/status_db_interface";
import { IntentfulTask_DB } from "../databases/intentful_task_db_interface";
import { Provider_DB } from "../databases/provider_db_interface";
import { Handler, IntentfulListener } from "./intentful_listener_interface";
import { EntryReference, Watchlist } from "./watchlist";
import { Spec, Status, IntentfulStatus, Diff, Differ, Metadata, Entity } from "papiea-core";
import { IntentfulTask } from "./task_interface";
import * as assert from "assert";
import { timeout } from "../utils/utils";
import { DiffResolver } from "./diff_resolver";
import { WinstonLogger } from "../logger";

export class TaskResolver {
    specDb: Spec_DB
    statusDb: Status_DB
    intentfulTaskDb: IntentfulTask_DB
    providerDb: Provider_DB

    intentfulListener: IntentfulListener
    differ: Differ
    diffResolver: DiffResolver;
    logger: WinstonLogger;

    constructor(specDb: Spec_DB, statusDb: Status_DB, intentfulTaskDb: IntentfulTask_DB, providerDb: Provider_DB, intentfulListener: IntentfulListener, differ: Differ, diffResolver: DiffResolver, logger: WinstonLogger) {
        this.specDb = specDb
        this.statusDb = statusDb
        this.providerDb = providerDb
        this.intentfulTaskDb = intentfulTaskDb
        this.logger = logger

        this.onChange = this.onChange.bind(this)
        this.onIntentfulHandlerFail = this.onIntentfulHandlerFail.bind(this)

        this.diffResolver = diffResolver
        this.differ = differ
        this.intentfulListener = intentfulListener
        this.intentfulListener.onChange = new Handler(this.onChange)
        this.diffResolver.onIntentfulHandlerFail = new Handler(this.onIntentfulHandlerFail)
    }

    private static inTerminalState(task: IntentfulTask): boolean {
        const terminal_states = [IntentfulStatus.Completed_Partially, IntentfulStatus.Completed_Successfully, IntentfulStatus.Outdated, IntentfulStatus.Failed]
        return terminal_states.includes(task.status)
    }

    private async clearTerminalStateTasks(taskExpirySeconds: number) {
        const tasks = await this.intentfulTaskDb.list_tasks({})
        for (let task of tasks) {
            if (TaskResolver.inTerminalState(task)) {
                if (task.last_status_changed && (new Date().getTime() - task.last_status_changed.getTime()) / 1000 > taskExpirySeconds) {
                    await this.intentfulTaskDb.delete_task(task.uuid)
                }
            }
        }
    }

    private async rediff(entity: Entity): Promise<Diff[]> {
        const provider = await this.providerDb.get_provider(entity.metadata.provider_prefix, entity.metadata.provider_version)
        const kind = this.providerDb.find_kind(provider, entity.metadata.kind)
        return this.differ.all_diffs(kind, entity.spec, entity.status)
    }

    private async processOutdatedTasks(tasks: IntentfulTask[], entity: Entity): Promise<IntentfulTask[]> {
        const diffs = await this.rediff(entity)
        for (let task of tasks) {
            if (TaskResolver.inTerminalState(task)) {
                continue
            }
            assert(task.spec_version < entity.metadata.spec_version, "Outdated task has spec version equal or higher than current")
            const task_diffs = new Set(task.diffs)
            const intersection = new Set(diffs.filter(diff => task_diffs.has(diff)))
            if (intersection.size === 0) {
                task.status = IntentfulStatus.Completed_Successfully
            } else if (intersection.size < task.diffs.length) {
                task.status = IntentfulStatus.Completed_Partially
            } else if (intersection.size >= task.diffs.length) {
                task.status = IntentfulStatus.Outdated
            }
            await this.intentfulTaskDb.update_task(task.uuid, { status: task.status, last_status_changed: new Date() })
        }
        return tasks
    }

    private async processActiveTask(active: IntentfulTask, entity: Entity): Promise<IntentfulTask> {
        const diffs = await this.rediff(entity)
        const task_diffs = new Set(active.diffs)
        const intersection = new Set(diffs.filter(diff => task_diffs.has(diff)))
        if (intersection.size === 0) {
            active.status = IntentfulStatus.Completed_Successfully
            await this.intentfulTaskDb.update_task(active.uuid, { status: active.status })
        } else if (intersection.size < active.diffs.length) {
            active.diffs = [...intersection]
            await this.intentfulTaskDb.update_task(active.uuid, { diffs: active.diffs })
        }
        return active
    }

    private async processPendingTasks(pending: IntentfulTask[], entity: Entity): Promise<IntentfulTask[]> {
        const diffs = await this.rediff(entity)
        for (let task of pending) {
            const task_diffs = new Set(task.diffs)
            const intersection = new Set(diffs.filter(diff => task_diffs.has(diff)))
            if (intersection.size === 0) {
                task.status = IntentfulStatus.Completed_Successfully
                await this.intentfulTaskDb.update_task(task.uuid, { status: task.status })
            } else if (intersection.size < task.diffs.length) {
                task.status = IntentfulStatus.Active
                task.diffs = [...intersection]
                await this.intentfulTaskDb.update_task(task.uuid, { diffs: task.diffs })
            }
        }
        return pending
    }

    private async onChange(entity: Entity) {
        console.log("Invoked on change")
        try {
            const tasks = await this.intentfulTaskDb.list_tasks({ entity_ref: { uuid: entity.metadata.uuid, kind: entity.metadata.kind } })
            const current_spec_version = entity.metadata.spec_version
            const latest_task = this.getLatestTask(tasks)
            if (latest_task && latest_task.spec_version === current_spec_version && latest_task.status === IntentfulStatus.Pending) {
                latest_task.status = IntentfulStatus.Active
                await this.intentfulTaskDb.update_task(latest_task.uuid, { status: latest_task.status })
                const rest = tasks.filter(task => task.spec_version !== current_spec_version)
                await this.processOutdatedTasks(rest, entity)
            } else if (latest_task && latest_task.spec_version === current_spec_version && latest_task.status === IntentfulStatus.Active) {
                await this.processActiveTask(latest_task, entity)
                const pending = tasks.filter(task => task.status === IntentfulStatus.Pending)
                await this.processPendingTasks(pending, entity)
            }
        } catch (e) {
            this.logger.debug(`Couldn't process entity with uuid: ${entity.metadata.uuid}`)
        }
    }

    private getLatestTask(tasks: IntentfulTask[]): IntentfulTask | null {
        let latest_task: IntentfulTask | null = null
        for (let task of tasks) {
            if (!latest_task) {
                latest_task = task
            }
            if (task.spec_version > latest_task.spec_version) {
                latest_task = task
            }
        }
        return latest_task
    }

    private async onIntentfulHandlerFail(entity: EntryReference, error_msg?: string) {
        const tasks = await this.intentfulTaskDb.list_tasks({ entity_ref: entity.entity_reference })
        const active_task = tasks.find(task => task.status === IntentfulStatus.Active)
        if (active_task) {
            active_task.times_failed += 1
            active_task.last_handler_error = error_msg
            await this.intentfulTaskDb.update_task(active_task.uuid, { times_failed: active_task.times_failed, last_handler_error: active_task.last_handler_error })
        }
    }

    public async run(delay: number, taskExpirySeconds: number) {
        try {
            await this._run(delay, taskExpirySeconds)
        } catch (e) {
            console.error(e)
            throw e
        }
    }

    protected async _run(delay: number, taskExpirySeconds: number) {
        while (true) {
            await timeout(delay)
            await this.clearTerminalStateTasks(taskExpirySeconds)
        }
    }
}