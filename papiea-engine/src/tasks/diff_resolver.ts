// [[file:~/work/papiea-js/Papiea-design.org::*/src/tasks/task_manager_interface.ts][/src/tasks/task_manager_interface.ts:1]]
import { getRandomInt, timeout } from "../utils/utils"
import { Spec_DB } from "../databases/spec_db_interface"
import { Status_DB } from "../databases/status_db_interface"
import { Delay, EntryReference, Watchlist } from "./watchlist"
import { Watchlist_DB } from "../databases/watchlist_db_interface";
import { Differ, Diff, Metadata, Spec, Status, Kind, IntentfulBehaviour } from "papiea-core";
import { Provider_DB } from "../databases/provider_db_interface";
import axios from "axios"
import { IntentfulContext } from "../intentful_core/intentful_context";
import { WinstonLogger } from "../logger";
import { Handler } from "./intentful_listener_interface";

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

    onIntentfulHandlerFail: Handler<(entity: EntryReference) => Promise<void>>
    onIntentfulHandlerRestart: Handler<(entity: EntryReference) => Promise<void>>


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
        this.onIntentfulHandlerFail = new Handler()
        this.onIntentfulHandlerRestart = new Handler()
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
            const updated_watchlist = await this.watchlistDb.get_watchlist()
            this.watchlist.update(updated_watchlist)
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
        // This yields delay
        const result = await axios.post(diff.intentful_signature.procedure_callback, {
            metadata: metadata,
            spec: spec,
            status: status,
            input: diff.diff_fields
        })
        const delay = {
            delay_seconds: result.data ?? kind.diff_delay ?? 10,
            delaySetTime: new Date()
        }
        // This should be a concrete address of a handling process
        diff.handler_url = `${diff.intentful_signature.base_callback}/healthcheck`
        return [diff, delay]
    }

    private async checkHealthy(diff: Diff): Promise<boolean> {
        try {
            const result = await axios.get(diff.handler_url!)
            return true
        } catch (e) {
            return false
        }
    }

    private async removeFromWatchlist(uuid: string) {
        this.watchlist.delete(uuid)
        await this.watchlistDb.update_watchlist(this.watchlist)
    }

    private async resolveDiffs() {
        const entries = this.watchlist.entries()

        for (let uuid in entries) {
            let [entry_reference, current_diff, current_delay] = entries[uuid]
            this.logger.debug(`Diff engine Processing entity with uuid: ${entry_reference.entity_reference.uuid}`)
            let diffs: Diff[] | undefined
            let metadata: Metadata | undefined, kind: Kind | undefined, spec: Spec | undefined, status: Status | undefined
            if (current_diff && current_delay) {
                // Delay for rediffing
                if ((new Date().getTime() - current_delay.delaySetTime.getTime()) / 1000 > current_delay.delay_seconds) {
                    [diffs, metadata, kind, spec, status] = await this.rediff(entry_reference)
                    const diff_index = diffs.map(diff => JSON.stringify(diff)).findIndex(diff => diff === JSON.stringify(current_diff))
                    // Diff still exists, we should check the health and retry if not healthy
                    console.log(diff_index)
                    if (diff_index) {
                        try {
                            if (await this.checkHealthy(diffs[diff_index])) {
                                continue
                            }
                            this.logger.info(`Starting to retry resolving diff for entity with uuid: ${metadata!.uuid}`)
                            await this.onIntentfulHandlerRestart.call(entry_reference)
                            const [, delay] = await this.launchOperation(diffs[diff_index], metadata, kind, spec, status)
                            entries[uuid][2] = delay
                        } catch (e) {
                            this.logger.debug(`Couldn't invoke retry handler for entity with uuid ${metadata!.uuid}: ${e}`)
                            entries[uuid][2] = {
                                delay_seconds: getRandomInt(10, 20),
                                delaySetTime: new Date()
                            }
                            await this.onIntentfulHandlerFail.call(entry_reference)
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
                    await this.removeFromWatchlist(uuid)
                    continue
                }
            }
            if (diffs.length === 0) {
                await this.removeFromWatchlist(uuid)
                continue
            }
            // No active diffs found, choosing the next one
            let next_diff: Diff
            const diff_selection_strategy = this.intentfulContext.getDiffSelectionStrategy(kind!)
            try {
                next_diff = diff_selection_strategy.selectOne(diffs)
            } catch (e) {
                this.logger.debug(`Entity with uuid ${metadata!.uuid}: ${e}`)
                await this.removeFromWatchlist(uuid)
                continue
            }
            try {
                const [executing_diff, execution_delay] = await this.launchOperation(next_diff!, metadata!, kind!, spec!, status!)
                entries[uuid][1] = executing_diff
                entries[uuid][2] = execution_delay
                this.logger.info(`Starting to resolve diff for entity with uuid: ${metadata!.uuid}`)
            } catch (e) {
                this.logger.debug(`Couldn't invoke handler for entity with uuid ${metadata!.uuid}: ${e}`)
                entries[uuid][2] = {
                    delay_seconds: getRandomInt(10, 20),
                    delaySetTime: new Date()
                }
                entries[uuid][1] = next_diff
                // This should be a concrete address of a handling process
                entries[uuid][1]!.handler_url = `${next_diff.intentful_signature.base_callback}/healthcheck`
                await this.onIntentfulHandlerFail.call(entry_reference)
            }
        }
        await this.watchlistDb.update_watchlist(this.watchlist)
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
                this.watchlist.set(metadata.uuid, [{
                    provider_reference: {
                        provider_prefix: metadata.provider_prefix,
                        provider_version: metadata.provider_version
                    },
                    entity_reference: {
                        uuid: metadata.uuid,
                        kind: metadata.kind
                    }
                }, undefined, undefined])
            } catch (e) {
                // this.logger.debug(`Couldn't get info for entity with uuid ${metadata.uuid}: ${e}. Skipping`)
            }
        }
        return this.watchlistDb.update_watchlist(this.watchlist)
    }
}