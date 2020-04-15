import { Spec_DB } from "../databases/spec_db_interface";
import { Status_DB } from "../databases/status_db_interface";
import { IntentfulTask_DB } from "../databases/intentful_task_db_interface";
import { Provider_DB } from "../databases/provider_db_interface";
import { Handler, IntentfulListener } from "./intentful_listener_interface";
import { EntryReference, Watchlist } from "./watchlist";
import { Spec, Status, IntentfulStatus, Diff, Differ, Metadata } from "papiea-core";
import { IntentfulTask } from "./task_interface";
import * as assert from "assert";
import { timeout } from "../utils/utils";
import { DiffResolver } from "./diff_resolver";

export class TaskResolver {
    specDb: Spec_DB
    statusDb: Status_DB
    intentfulTaskDb: IntentfulTask_DB
    providerDb: Provider_DB

    intentfulListener: IntentfulListener
    differ: Differ
    diffResolver: DiffResolver;
    watchlist: Watchlist;

    constructor(specDb: Spec_DB, statusDb: Status_DB, intentfulTaskDb: IntentfulTask_DB, providerDb: Provider_DB, intentfulListener: IntentfulListener, differ: Differ, diffResolver: DiffResolver, watchlist: Watchlist) {
        this.specDb = specDb
        this.statusDb = statusDb
        this.providerDb = providerDb
        this.intentfulTaskDb = intentfulTaskDb

        this.onSpec = this.onSpec.bind(this)
        this.onStatus = this.onStatus.bind(this)
        this.onIntentfulHandlerFail = this.onIntentfulHandlerFail.bind(this)
        this.onIntentfulHandlerRestart = this.onIntentfulHandlerRestart.bind(this)

        this.watchlist = watchlist
        this.diffResolver = diffResolver
        this.differ = differ
        this.intentfulListener = intentfulListener
        this.diffResolver.onIntentfulHandlerFail = new Handler(this.onIntentfulHandlerFail)
        this.diffResolver.onIntentfulHandlerRestart = new Handler(this.onIntentfulHandlerRestart)
        this.intentfulListener.onSpec = new Handler(this.onSpec)
        this.intentfulListener.onStatus = new Handler(this.onStatus)
    }

    private static inTerminalState(task: IntentfulTask): boolean {
        const terminal_states = [IntentfulStatus.Completed_Partially, IntentfulStatus.Completed_Successfully, IntentfulStatus.Outdated]
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

    private async rediff(entry_reference: EntryReference, metadata: Metadata, spec: Spec, status: Status): Promise<Diff[]> {
        const provider = await this.providerDb.get_provider(entry_reference.provider_reference.provider_prefix, entry_reference.provider_reference.provider_version)
        const kind = this.providerDb.find_kind(provider, metadata.kind)
        return this.differ.all_diffs(kind, spec, status)
    }

    private async onSpec(entity: EntryReference, specVersion: number, spec: Spec) {
        const [metadata, status] = await this.statusDb.get_status(entity.entity_reference)
        const tasks = await this.intentfulTaskDb.list_tasks({ entity_ref: entity.entity_reference })
        const created_task = tasks.find(task => task.spec_version === specVersion && !TaskResolver.inTerminalState(task))
        const rest = tasks.filter(task => task.spec_version !== specVersion && !TaskResolver.inTerminalState(task))
        if (created_task) {
            created_task.status = IntentfulStatus.Active
            await this.intentfulTaskDb.update_task(created_task.uuid, { status: created_task.status })
        }
        const diffs = await this.rediff(entity, metadata, spec, status)
        for (let task of rest) {
            assert(task.spec_version < specVersion, "Old task has higher spec version then newly created")
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
    }

    private async onStatus(entity: EntryReference, status: Status) {
        const [metadata, spec] = await this.specDb.get_spec(entity.entity_reference)
        const tasks = await this.intentfulTaskDb.list_tasks({ entity_ref: entity.entity_reference })
        const diffs = await this.rediff(entity, metadata, spec, status)
        const active = tasks.find(task => task.status === IntentfulStatus.Active)
        if (active) {
            const task_diffs = new Set(active.diffs)
            const intersection = new Set(diffs.filter(diff => task_diffs.has(diff)))
            if (intersection.size === 0) {
                active.status = IntentfulStatus.Completed_Successfully
                await this.intentfulTaskDb.update_task(active.uuid, { status: active.status })
            } else if (intersection.size < active.diffs.length) {
                active.diffs = [...intersection]
                await this.intentfulTaskDb.update_task(active.uuid, { diffs: active.diffs })
                return
            }
        }
        const pending = tasks.filter(task => task.status === IntentfulStatus.Pending)
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
                return
            }
        }
    }

    private async onIntentfulHandlerFail(entity: EntryReference) {
        const tasks = await this.intentfulTaskDb.list_tasks({ entity_ref: entity.entity_reference })
        const active_task = tasks.find(task => task.status === IntentfulStatus.Active)
        if (active_task) {
            active_task.status = IntentfulStatus.Failed
            await this.intentfulTaskDb.update_task(active_task.uuid, { status: active_task.status })
        }
    }

    private async onIntentfulHandlerRestart(entity: EntryReference) {
        const tasks = await this.intentfulTaskDb.list_tasks({ entity_ref: entity.entity_reference })
        const failed_task = tasks.find(task => task.status === IntentfulStatus.Failed)
        if (failed_task) {
            failed_task.status = IntentfulStatus.Active
            await this.intentfulTaskDb.update_task(failed_task.uuid, { status: failed_task.status })
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