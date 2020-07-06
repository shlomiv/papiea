import { Spec_DB } from "../databases/spec_db_interface";
import { Status_DB } from "../databases/status_db_interface";
import { IntentWatcher_DB } from "../databases/intent_watcher_db_interface";
import { Provider_DB } from "../databases/provider_db_interface";
import { Handler, IntentfulListener } from "./intentful_listener_interface";
import { EntryReference, Watchlist } from "./watchlist";
import { IntentfulStatus, Diff, Differ, Entity } from "papiea-core";
import { IntentWatcher } from "./intent_interface";
import * as assert from "assert";
import { timeout } from "../utils/utils";
import { DiffResolver } from "./diff_resolver";
import { Logger } from "papiea-backend-utils";
import deepEqual = require("deep-equal");

export class TaskResolver {
    private readonly specDb: Spec_DB
    private readonly statusDb: Status_DB
    private readonly intentWatcherDb: IntentWatcher_DB
    private readonly providerDb: Provider_DB

    private intentfulListener: IntentfulListener
    private differ: Differ
    private diffResolver: DiffResolver;
    private logger: Logger;
    private watchlist: Watchlist;

    constructor(specDb: Spec_DB, statusDb: Status_DB,
                intentfulTaskDb: IntentWatcher_DB, providerDb: Provider_DB,
                intentfulListener: IntentfulListener, differ: Differ,
                diffResolver: DiffResolver, watchlist: Watchlist,
                logger: Logger)
    {
        this.specDb = specDb
        this.statusDb = statusDb
        this.providerDb = providerDb
        this.intentWatcherDb = intentfulTaskDb
        this.logger = logger

        this.onChange = this.onChange.bind(this)
        this.onIntentfulHandlerFail = this.onIntentfulHandlerFail.bind(this)

        this.watchlist = watchlist
        this.diffResolver = diffResolver
        this.differ = differ
        this.intentfulListener = intentfulListener
        this.intentfulListener.onChange = new Handler(this.onChange)
        this.diffResolver.onIntentfulHandlerFail = new Handler(this.onIntentfulHandlerFail)
    }

    private static getIntersection(current_diffs: Diff[], task_diffs: Diff[], predicate: (curr_diff: Diff, task_diff: Diff) => boolean): Set<Diff> {
        const intersection: Set<Diff> = new Set()
        for (let diff of current_diffs) {
            for (let task_diff of task_diffs) {
                if (predicate(diff, task_diff)) {
                    intersection.add(diff)
                }
            }
        }
        return intersection
    }

    private static inTerminalState(task: IntentWatcher): boolean {
        const terminal_states = [IntentfulStatus.Completed_Partially, IntentfulStatus.Completed_Successfully, IntentfulStatus.Outdated, IntentfulStatus.Failed]
        return terminal_states.includes(task.status)
    }

    private async clearTerminalStateTasks(taskExpirySeconds: number) {
        const tasks = await this.intentWatcherDb.list_tasks({})
        for (let task of tasks) {
            if (TaskResolver.inTerminalState(task)) {
                if (task.last_status_changed && (new Date().getTime() - task.last_status_changed.getTime()) / 1000 > taskExpirySeconds) {
                    await this.intentWatcherDb.delete_task(task.uuid)
                }
            }
        }
    }

    private async rediff(entity: Entity): Promise<Diff[]> {
        const provider = await this.providerDb.get_provider(entity.metadata.provider_prefix, entity.metadata.provider_version)
        const kind = this.providerDb.find_kind(provider, entity.metadata.kind)
        return this.differ.all_diffs(kind, entity.spec, entity.status)
    }

    private async processOutdatedTasks(tasks: IntentWatcher[], entity: Entity): Promise<IntentWatcher[]> {
        const diffs = await this.rediff(entity)
        for (let task of tasks) {
            if (TaskResolver.inTerminalState(task)) {
                continue
            }
            assert(task.spec_version < entity.metadata.spec_version, "Outdated task has spec version equal or higher than current")
            const intersection = TaskResolver.getIntersection(diffs, task.diffs, (diff, task_diff) => deepEqual(diff.diff_fields, task_diff.diff_fields))
            if (intersection.size === 0) {
                task.status = IntentfulStatus.Completed_Successfully
            } else if (intersection.size < task.diffs.length) {
                task.status = IntentfulStatus.Completed_Partially
            } else if (intersection.size >= task.diffs.length) {
                task.status = IntentfulStatus.Outdated
            }
            await this.intentWatcherDb.update_task(task.uuid, { status: task.status, last_status_changed: new Date() })
        }
        return tasks
    }

    private async processActiveTask(active: IntentWatcher, entity: Entity): Promise<IntentWatcher> {
        const diffs = await this.rediff(entity)
        const intersection = TaskResolver.getIntersection(diffs, active.diffs, (diff, task_diff) => deepEqual(diff.diff_fields, task_diff.diff_fields))
        if (intersection.size === 0) {
            active.status = IntentfulStatus.Completed_Successfully
            await this.intentWatcherDb.update_task(active.uuid, { status: active.status })
        } else if (intersection.size < active.diffs.length) {
            active.diffs = [...intersection]
            await this.intentWatcherDb.update_task(active.uuid, { diffs: active.diffs })
        }
        return active
    }

    private async processPendingTasks(pending: IntentWatcher[], entity: Entity): Promise<IntentWatcher[]> {
        const diffs = await this.rediff(entity)
        for (let task of pending) {
            const intersection = TaskResolver.getIntersection(diffs, task.diffs, (diff, task_diff) => deepEqual(diff.diff_fields, task_diff.diff_fields))
            if (intersection.size === 0) {
                task.status = IntentfulStatus.Completed_Successfully
                await this.intentWatcherDb.update_task(task.uuid, { status: task.status })
            } else if (intersection.size < task.diffs.length) {
                task.status = IntentfulStatus.Active
                task.diffs = [...intersection]
                await this.intentWatcherDb.update_task(task.uuid, { diffs: task.diffs })
            }
        }
        return pending
    }

    private async onChange(entity: Entity) {
        try {
            const tasks = await this.intentWatcherDb.list_tasks({ entity_ref: { uuid: entity.metadata.uuid, kind: entity.metadata.kind } })
            const current_spec_version = entity.metadata.spec_version
            const latest_task = this.getLatestTask(tasks)
            if (latest_task && latest_task.spec_version === current_spec_version && latest_task.status === IntentfulStatus.Pending) {
                latest_task.status = IntentfulStatus.Active
                await this.intentWatcherDb.update_task(latest_task.uuid, { status: latest_task.status })
                await this.processActiveTask(latest_task, entity)
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

    private getLatestTask(tasks: IntentWatcher[]): IntentWatcher | null {
        let latest_task: IntentWatcher | null = null
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
        const tasks = await this.intentWatcherDb.list_tasks({ entity_ref: entity.entity_reference })
        const active_task = tasks.find(task => task.status === IntentfulStatus.Active)
        if (active_task) {
            active_task.times_failed += 1
            active_task.last_handler_error = error_msg
            await this.intentWatcherDb.update_task(active_task.uuid, { times_failed: active_task.times_failed, last_handler_error: active_task.last_handler_error })
        }
    }

    private async updateTasksStatuses() {
        let entries = this.watchlist.entries();
        for (let uuid in entries) {
            const [entry_ref, diff, delay] = entries[uuid]
            const tasks = await this.intentWatcherDb.list_tasks({ entity_ref: entry_ref.entity_reference })
            if (tasks.length !== 0) {
                try {
                    const [metadata, spec] = await this.specDb.get_spec(entry_ref.entity_reference)
                    const [, status] = await this.statusDb.get_status(entry_ref.entity_reference)
                    this.onChange({ metadata, spec, status })
                } catch (e) {

                }
            }
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
            this.clearTerminalStateTasks(taskExpirySeconds)
            this.updateTasksStatuses()
        }
    }
}
