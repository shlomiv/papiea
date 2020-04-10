import { Status, Spec } from "papiea-core"
import { Handler, IntentfulListener } from "./intentful_listener_interface"
import { IntentfulTask_DB } from "../databases/intentful_task_db_interface"
import { EntryReference, Watchlist } from "./watchlist"
import { Status_DB } from "../databases/status_db_interface"
import { timeout } from "../utils/utils"
import { Spec_DB } from "../databases/spec_db_interface";

export class IntentfulListenerMongo implements IntentfulListener {
    private readonly intentfulTaskDb: IntentfulTask_DB
    private watchlist: Watchlist
    private statuses: Map<EntryReference, Status>
    private specs: Map<EntryReference, Spec>
    private specDb: Spec_DB
    private statusDb: Status_DB
    onSpec: Handler<(entity: EntryReference, specVersion: number, spec: Spec) => Promise<void>>
    onStatus: Handler<(entity: EntryReference, status: Status) => Promise<void>>

    private async populate_spec_list(): Promise<void> {
        const entities = await this.specDb.list_specs({})
        for (let [metadata, spec] of entities) {
            const entry_reference: EntryReference = {
                provider_reference: {
                    provider_version: metadata.provider_version,
                    provider_prefix: metadata.provider_prefix
                },
                entity_reference: {
                    uuid: metadata.uuid,
                    kind: metadata.kind
                }
            }
            if (this.watchlist.has(entry_reference)) {
                const spec_entry = this.specs.get(entry_reference)
                if (!spec_entry || JSON.stringify(spec_entry) !== JSON.stringify(spec)) {
                    await this.onSpec.call(entry_reference, metadata.spec_version, spec)
                }
            }
        }
    }

    private async populate_status_list(): Promise<void> {
        const entities = await this.statusDb.list_status({})
        for (let [metadata, status] of entities) {
            const entry_reference: EntryReference = {
                provider_reference: {
                    provider_version: metadata.provider_version,
                    provider_prefix: metadata.provider_prefix
                },
                entity_reference: {
                    uuid: metadata.uuid,
                    kind: metadata.kind
                }
            }
            if (this.watchlist.has(entry_reference)) {
                const status_entry = this.statuses.get(entry_reference)
                if (!status_entry || JSON.stringify(status_entry) !== JSON.stringify(status)) {
                    await this.onSpec.call(entry_reference, status)
                }
            }
        }
    }

    constructor(intentfulTaskDb: IntentfulTask_DB, statusDb: Status_DB, specDb: Spec_DB, watchlist: Watchlist) {
        this.statusDb = statusDb
        this.intentfulTaskDb = intentfulTaskDb
        this.specDb = specDb
        this.onSpec = new Handler()
        this.onStatus = new Handler()
        this.watchlist = watchlist
        this.statuses = new Map<EntryReference, Status>()
        this.specs = new Map<EntryReference, Spec>()
    }

    public async run(delay: number) {
        try {
            await this._run(delay)
        } catch (e) {
            console.error(e)
            throw e
        }
    }

    protected async _run(delay: number) {
        await timeout(delay)
        await this.populate_spec_list()
        await this.populate_status_list()
    }
}