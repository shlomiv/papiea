// [[file:~/work/papiea-js/Papiea-design.org::*/src/tasks/task_manager_interface.ts][/src/tasks/task_manager_interface.ts:1]]
import { timeout } from "../utils/utils"
import { Spec_DB } from "../databases/spec_db_interface"
import { Status_DB } from "../databases/status_db_interface"
import { Delay, EntryReference, Watchlist } from "./watchlist"
import { Watchlist_DB } from "../databases/watchlist_db_interface";
import { Differ, Diff, Metadata, Spec, Status } from "papiea-core";
import { Provider_DB } from "../databases/provider_db_interface";
import axios from "axios"

// This should be run in a different process
export class DiffResolver {
    protected readonly specDb: Spec_DB
    protected readonly statusDb: Status_DB
    private watchlistDb: Watchlist_DB
    protected watchlist: Watchlist
    private differ: Differ
    private providerDb: Provider_DB

    constructor(watchlist: Watchlist, watchlistDb: Watchlist_DB, specDb: Spec_DB, statusDb: Status_DB, providerDb: Provider_DB, differ: Differ) {
        this.specDb = specDb
        this.statusDb = statusDb
        this.watchlistDb = watchlistDb
        this.providerDb = providerDb
        this.watchlist = watchlist
        this.differ = differ
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
            await this.updateWatchlist()
            await this.resolveDiffs()
        }
    }

    private async updateWatchlist() {
        this.watchlist = await this.watchlistDb.get_watchlist()
    }

    private async rediff(entry_reference: EntryReference): Promise<[Diff[], Metadata, Spec, Status]> {
        const [metadata, spec] = await this.specDb.get_spec(entry_reference.entity_reference)
        const [, status] = await this.statusDb.get_status(entry_reference.entity_reference)
        const provider = await this.providerDb.get_provider(entry_reference.provider_reference.provider_prefix, entry_reference.provider_reference.provider_version)
        const kind = this.providerDb.find_kind(provider, metadata.kind)
        return [this.differ.all_diffs(kind, spec, status), metadata, spec, status]
    }

    private async launchOperation(diff: Diff, metadata: Metadata, spec: Spec,  status: Status): Promise<[Diff, Delay]> {
        // This yields delay
        await axios.post(diff.intentful_signature.procedure_callback, {
            metadata: metadata,
            spec: spec,
            status: status,
            input: diff.diff_fields
        })
        const delay = {
            delay_seconds: 20,
            delaySetTime: new Date()
        }
        // This should be a concrete address of a handling process
        diff.handler_url = `${diff.intentful_signature.base_callback}/healthcheck`
        return [diff, delay]
    }

    private removeDiff(entry_reference: EntryReference) {
        this.watchlist.delete(entry_reference)
    }

    private async resolveDiffs() {
        for (let [entry_reference, [current_diff, current_delay]] of this.watchlist.entries()) {
            let diffs: Diff[] | undefined
            let metadata: Metadata | undefined, spec: Spec | undefined, status: Status | undefined
            if (current_diff && current_delay) {
                // Delay for rediffing
                if ((new Date().getTime() - current_delay.delaySetTime.getTime()) / 1000 > current_delay.delay_seconds) {
                    [diffs, metadata, spec, status] = await this.rediff(entry_reference)
                    const diff_exists = diffs.map(diff => JSON.stringify(diff)).find(diff => diff === JSON.stringify(current_diff))
                    // Diff still exists, we should retry
                    if (diff_exists) {
                        const [, delay] = await this.launchOperation(diffs[0], metadata, spec, status)
                        current_delay = delay
                    }
                } else {
                    continue
                }
            }
            // Check if we have already rediffed this entity
            if (diffs === undefined) {
                [diffs, metadata, spec, status] = await this.rediff(entry_reference)
            }
            if (diffs.length === 0) {
                this.removeDiff(entry_reference)
                return
            }
            // No active diffs found, choosing the next one
            const [executing_diff, execution_delay] = await this.launchOperation(diffs[0], metadata!, spec!, status!)
            current_diff = executing_diff
            current_delay = execution_delay
        }
    }
}