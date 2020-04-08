// [[file:~/work/papiea-js/Papiea-design.org::*/src/tasks/task_manager_interface.ts][/src/tasks/task_manager_interface.ts:1]]
import { timeout } from "../utils/utils"
import { Spec_DB } from "../databases/spec_db_interface"
import { Status_DB } from "../databases/status_db_interface"
import { Delay, EntryReference, Watchlist } from "./watchlist"
import { Watchlist_DB } from "../databases/watchlist_db_interface";
import { Differ, Diff, Metadata, Spec, Status, Kind, IntentfulBehaviour } from "papiea-core";
import { Provider_DB } from "../databases/provider_db_interface";
import axios from "axios"
import { IntentfulContext } from "../intentful_core/intentful_context";
import { WinstonLogger } from "../logger";

export class DiffResolver {
    protected readonly specDb: Spec_DB
    protected readonly statusDb: Status_DB
    private readonly watchlistDb: Watchlist_DB
    private readonly providerDb: Provider_DB
    protected watchlist: Watchlist
    private differ: Differ
    private intentfulContext: IntentfulContext;
    private logger: WinstonLogger;
    private batchSize: number;

    constructor(watchlist: Watchlist, watchlistDb: Watchlist_DB, specDb: Spec_DB, statusDb: Status_DB, providerDb: Provider_DB, differ: Differ, intentfulContext: IntentfulContext, logger: WinstonLogger, batchSize: number) {
        this.specDb = specDb
        this.statusDb = statusDb
        this.watchlistDb = watchlistDb
        this.providerDb = providerDb
        this.watchlist = watchlist
        this.differ = differ
        this.intentfulContext = intentfulContext
        this.logger = logger
        this.batchSize = batchSize
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
            await this.addRandomEntities()
        }
    }

    private async updateWatchlist() {
        try {
            this.watchlist = await this.watchlistDb.get_watchlist()
        } catch (e) {
            return
        }
    }

    private async rediff(entry_reference: EntryReference): Promise<[Diff[], Metadata, Kind, Spec, Status]> {
        const [metadata, spec] = await this.specDb.get_spec(entry_reference.entity_reference)
        const [, status] = await this.statusDb.get_status(entry_reference.entity_reference)
        const provider = await this.providerDb.get_provider(entry_reference.provider_reference.provider_prefix, entry_reference.provider_reference.provider_version)
        const kind = this.providerDb.find_kind(provider, metadata.kind)
        return [this.differ.all_diffs(kind, spec, status), metadata, kind, spec, status]
    }

    private async launchOperation(diff: Diff, metadata: Metadata, kind: Kind, spec: Spec,  status: Status): Promise<[Diff, Delay]> {
        console.log(diff.intentful_signature.procedure_callback)
        // This yields delay
        const result = await axios.post(diff.intentful_signature.procedure_callback, {
            metadata: metadata,
            spec: spec,
            status: status,
            input: diff.diff_fields
        })
        const delay = {
            delay_seconds: result.data ?? kind.diff_delay ?? 3,
            delaySetTime: new Date()
        }
        // This should be a concrete address of a handling process
        diff.handler_url = `${diff.intentful_signature.base_callback}/healthcheck`
        return [diff, delay]
    }

    private async removeDiff(entry_reference: EntryReference) {
        this.watchlist.delete(entry_reference)
        await this.watchlistDb.update_watchlist(this.watchlist)
    }

    private async resolveDiffs() {
        for (let [json_entry_reference, [current_diff, current_delay]] of this.watchlist.entries()) {
            let entry_reference: EntryReference = JSON.parse(json_entry_reference)
            this.logger.debug(`Diff engine Processing entity with uuid: ${entry_reference.entity_reference.uuid}`)
            let diffs: Diff[] | undefined
            let metadata: Metadata | undefined, kind: Kind | undefined, spec: Spec | undefined, status: Status | undefined
            if (current_diff && current_delay) {
                // Delay for rediffing
                if ((new Date().getTime() - current_delay.delaySetTime.getTime()) / 1000 > current_delay.delay_seconds) {
                    [diffs, metadata, kind, spec, status] = await this.rediff(entry_reference)
                    const diff_index = diffs.map(diff => JSON.stringify(diff)).findIndex(diff => diff === JSON.stringify(current_diff))
                    // Diff still exists, we should retry
                    if (diff_index) {
                        try {
                            const [, delay] = await this.launchOperation(diffs[ diff_index ], metadata, kind, spec, status)
                            current_delay = delay
                            this.logger.info(`Starting to retry resolving diff for entity with uuid: ${metadata!.uuid}`)
                        } catch (e) {
                            this.logger.warning(`Couldn't invoke retry handler for entity with uuid ${metadata!.uuid}: ${e}`)
                            current_delay = {
                                delay_seconds: 3,
                                delaySetTime: new Date()
                            }
                        }
                    }
                } else {
                    continue
                }
            }
            // Check if we have already rediffed this entity
            if (diffs === undefined) {
                try {
                    [diffs, metadata, kind, spec, status] = await this.rediff(entry_reference)
                } catch (e) {
                    this.logger.debug(`Couldn't rediff entity with uuid ${entry_reference.entity_reference.uuid}: ${e}. Removing from watchlist`)
                    await this.removeDiff(entry_reference)
                    continue
                }
            }
            if (diffs.length === 0) {
                await this.removeDiff(entry_reference)
                continue
            }
            // No active diffs found, choosing the next one
            let next_diff: Diff
            const diff_selection_strategy = this.intentfulContext.getDiffSelectionStrategy(kind!)
            try {
                next_diff = diff_selection_strategy.selectOne(diffs)
            } catch (e) {
                this.logger.debug(`Entity with uuid ${metadata!.uuid}: ${e}`)
                await this.removeDiff(entry_reference)
                continue
            }
            try {
                const [executing_diff, execution_delay] = await this.launchOperation(next_diff!, metadata!, kind!, spec!, status!)
                current_diff = executing_diff
                current_delay = execution_delay
                this.logger.info(`Starting to resolve diff for entity with uuid: ${metadata!.uuid}`)
            } catch (e) {
                this.logger.info(`Couldn't invoke handler for entity with uuid ${metadata!.uuid}: ${e}`)
            }
        }
    }

    private async calculate_batch_size(): Promise<number> {
        return this.batchSize
    }

    // This method is needed to avoid race condition
    // when diffs may be added between the check and removing from the watchlist
    // the batch size maybe static or dynamic
    private async addRandomEntities() {
        const batch_size = await this.calculate_batch_size()
        const entities = await this.specDb.list_random_specs(batch_size)

        for (let [metadata, _] of entities) {
            try {
                const provider = await this.providerDb.get_provider(metadata.provider_prefix, metadata.provider_version)
                const kind = this.providerDb.find_kind(provider, metadata.kind)
                if (kind.intentful_behaviour !== IntentfulBehaviour.Differ) {
                    continue
                }
                this.watchlist.set({
                    provider_reference: {
                        provider_prefix: metadata.provider_prefix,
                        provider_version: metadata.provider_version
                    },
                    entity_reference: {
                        uuid: metadata.uuid,
                        kind: metadata.kind
                    }
                }, [undefined, undefined])
            } catch (e) {
                this.logger.debug(`Couldn't get info for entity with uuid ${metadata.uuid}: ${e}. Skipping`)
            }
        }
        return this.watchlistDb.update_watchlist(this.watchlist)
    }
}