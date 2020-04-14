import { IntentfulStrategy } from "./intentful_strategy_interface"
import { Spec_DB } from "../../databases/spec_db_interface"
import { Status_DB } from "../../databases/status_db_interface"
import { Differ, Metadata, Spec } from "papiea-core"
import { IntentfulTask_DB } from "../../databases/intentful_task_db_interface"
import { IntentfulTask } from "../../tasks/task_interface"
import { IntentfulStatus } from "papiea-core"
import { Watchlist_DB } from "../../databases/watchlist_db_interface";
import uuid = require("uuid")

export class DifferIntentfulStrategy extends IntentfulStrategy {
    protected differ: Differ
    protected intentfulTaskDb: IntentfulTask_DB
    protected watchlistDb: Watchlist_DB;

    constructor(specDb: Spec_DB, statusDb: Status_DB, differ: Differ, intentfulTaskDb: IntentfulTask_DB, watchlistDb: Watchlist_DB) {
        super(specDb, statusDb)
        this.differ = differ
        this.intentfulTaskDb = intentfulTaskDb
        this.watchlistDb = watchlistDb
    }

    async update_entity(metadata: Metadata, spec: Spec): Promise<[Metadata, Spec]> {
        const [updatedMetadata, updatedSpec] = await this.specDb.update_spec(metadata, spec);
        return [updatedMetadata, updatedSpec]
    }

    async update(metadata: Metadata, spec: Spec): Promise<IntentfulTask | null> {
        const [_, status] = await this.statusDb.get_status(metadata)
        const task: IntentfulTask = {
            uuid: uuid(),
            entity_ref: {
                uuid: metadata.uuid,
                kind: metadata.kind
            },
            diffs: [],
            spec_version: metadata.spec_version,
            user: this.user,
            status: IntentfulStatus.Pending
        }
        for (let diff of this.differ.diffs(this.kind!, spec, status)) {
            task.diffs.push(diff)
        }
        await this.intentfulTaskDb.save_task(task)
        const watchlist = await this.watchlistDb.get_watchlist()
        if (!watchlist.has(metadata.uuid)) {
            watchlist.set(metadata.uuid, [{
                provider_reference: {
                    provider_prefix: metadata.provider_prefix,
                    provider_version: metadata.provider_version
                },
                entity_reference: {
                    uuid: metadata.uuid,
                    kind: metadata.kind
                }
            }, undefined, undefined])
            await this.watchlistDb.update_watchlist(watchlist)
        }
        await this.update_entity(metadata, spec)
        return task
    }
}