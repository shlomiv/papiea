import { Spec_DB } from "../databases/spec_db_interface";
import { Status_DB } from "../databases/status_db_interface";
import { IntentfulTask_DB } from "../databases/intentful_task_db_interface";
import { Provider_DB } from "../databases/provider_db_interface";
import { Handler, IntentfulListener } from "./intentful_listener_interface";
import { EntryReference } from "./watchlist";
import { Spec, Status, IntentfulStatus, Diff, Differ, Metadata } from "papiea-core";
import { IntentfulTask } from "./task_interface";
import * as assert from "assert";
import uuid = require("uuid");
import { timeout } from "../utils/utils";

export class TaskResolver {
    specDb: Spec_DB
    statusDb: Status_DB
    intentfulTaskDb: IntentfulTask_DB
    providerDb: Provider_DB

    intentfulListener: IntentfulListener
    differ: Differ

    constructor(specDb: Spec_DB, statusDb: Status_DB, intentfulTaskDb: IntentfulTask_DB, providerDb: Provider_DB, intentfulListener: IntentfulListener, differ: Differ) {
        this.specDb = specDb
        this.statusDb = statusDb
        this.providerDb = providerDb
        this.intentfulTaskDb = intentfulTaskDb

        this.onSpec = this.onSpec.bind(this)
        this.onStatus = this.onStatus.bind(this)

        this.differ = differ
        this.intentfulListener = intentfulListener
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
        const active_or_failed = tasks.find(task => task.status === IntentfulStatus.Active || task.status === IntentfulStatus.Failed)
        if (active_or_failed) {
            assert(active_or_failed.spec_version < specVersion, "Error got a spec with older spec version then active or failed one")
        }
        const diffs = await this.rediff(entity, metadata, spec, status)
        for (let task of tasks) {
            if (TaskResolver.inTerminalState(task)) {
                continue
            }
            const task_diffs = new Set(task.diffs)
            const intersection = new Set(diffs.filter(diff => task_diffs.has(diff)))
            if (intersection.size < task.diffs.length) {
                task.status = IntentfulStatus.Completed_Partially
            } else if (intersection.size >= task.diffs.length) {
                task.status = IntentfulStatus.Outdated
            }
            await this.intentfulTaskDb.update_task(task.uuid, { status: task.status, last_status_changed: new Date() })
        }
        const new_task: IntentfulTask = {
            uuid: uuid(),
            spec_version: specVersion,
            entity_ref: entity.entity_reference,
            diffs: diffs,
            status: diffs.length === 0 ? IntentfulStatus.Completed_Successfully : IntentfulStatus.Pending
        }
        await this.intentfulTaskDb.save_task(new_task)
    }

    private async onStatus(entity: EntryReference, status: Status) {
        const [metadata, spec] = await this.specDb.get_spec(entity.entity_reference)
        const tasks = await this.intentfulTaskDb.list_tasks({ entity_ref: entity.entity_reference })
        const diffs = await this.rediff(entity, metadata, spec, status)
        const failed = tasks.find(task => task.status === IntentfulStatus.Failed)
        if (failed) {
            failed.status = IntentfulStatus.Active
            await this.intentfulTaskDb.update_task(failed.uuid, { status: failed.status })
            return
        }
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
        const first_pending = tasks.find(task => task.status === IntentfulStatus.Pending)
        if (first_pending) {
            first_pending.status = IntentfulStatus.Active
            await this.intentfulTaskDb.update_task(first_pending.uuid, { status: first_pending.status })
        }
    }

    // private async onIntentfulHandlerFail(entity: EntryReference) {
    //
    // }

    public async run(delay: number, taskExpirySeconds: number) {
        try {
            await this._run(delay, taskExpirySeconds)
        } catch (e) {
            console.error(e)
            throw e
        }
    }

    protected async _run(delay: number, taskExpirySeconds: number) {
        await timeout(delay)
        await this.clearTerminalStateTasks(taskExpirySeconds)
    }
}