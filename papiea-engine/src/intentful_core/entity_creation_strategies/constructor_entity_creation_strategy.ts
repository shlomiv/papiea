import {EntityCreationStrategy} from "./entity_creation_strategy_interface"
import {
    Differ,
    Entity,
    IntentfulBehaviour,
    IntentfulStatus,
    IntentWatcher,
    Metadata,
    Spec,
    Status
} from "papiea-core"
import {OnActionError} from "../../errors/on_action_error"
import axios from "axios"
import {create_entry} from "../../intentful_engine/watchlist"
import {Spec_DB} from "../../databases/spec_db_interface"
import {Status_DB} from "../../databases/status_db_interface"
import {Graveyard_DB} from "../../databases/graveyard_db_interface"
import {IntentWatcher_DB} from "../../databases/intent_watcher_db_interface"
import {Watchlist_DB} from "../../databases/watchlist_db_interface"
import deepEqual = require("deep-equal")
import uuid = require("uuid")
import {Validator} from "../../validator"

export class ConstructorEntityCreationStrategy extends EntityCreationStrategy {
    protected differ: Differ
    protected intentWatcherDb: IntentWatcher_DB
    protected watchlistDb: Watchlist_DB;

    constructor(specDb: Spec_DB, statusDb: Status_DB, graveyardDb: Graveyard_DB, watchlistDb: Watchlist_DB, validator: Validator, differ: Differ, intentWatcherDb: IntentWatcher_DB) {
        super(specDb, statusDb, graveyardDb, watchlistDb, validator)
        this.differ = differ
        this.intentWatcherDb = intentWatcherDb
        this.watchlistDb = watchlistDb
    }

    protected async save_entity(entity: Entity): Promise<[Metadata, Spec, Status]> {
        // Create increments spec version so we should check already incremented one
        await this.check_spec_version(entity.metadata, entity.metadata.spec_version + 1, entity.spec)
        const [updatedMetadata, updatedSpec] = await this.specDb.update_spec(entity.metadata, entity.spec);
        await this.statusDb.replace_status(entity.metadata, entity.status)
        return [updatedMetadata, updatedSpec, entity.status]
    }

    public async create(input: any): Promise<[IntentWatcher | null, [Metadata, Spec, Status]]> {
        const entity = await this.dispatch(`__${ this.kind?.name }_create`, input)
        const [created_metadata, created_spec, created_status] = await this.save_entity(entity)
        let watcher: null | IntentWatcher = null
        if (!deepEqual(created_spec, created_status) && this.kind?.intentful_behaviour === IntentfulBehaviour.Differ) {
            watcher = {
                uuid: uuid(),
                entity_ref: {
                    uuid: created_metadata.uuid,
                    kind: created_metadata.kind,
                    provider_prefix: created_metadata.provider_prefix,
                    provider_version: created_metadata.provider_version,
                },
                diffs: [],
                spec_version: created_metadata.spec_version,
                user: this.user,
                status: IntentfulStatus.Active,
            }
            for (let diff of this.differ.diffs(this.kind!, created_spec, created_status)) {
                watcher.diffs.push(diff)
            }
            await this.intentWatcherDb.save_watcher(watcher)
            const watchlist = await this.watchlistDb.get_watchlist()
            const ent = create_entry(created_metadata)
            if (!watchlist.has(ent)) {
                watchlist.set([ent, []])
                await this.watchlistDb.update_watchlist(watchlist)
            }
        }
        return [watcher, [created_metadata, created_spec, created_status]]
    }

    protected async dispatch(procedure_name: string, input: any): Promise<Entity> {
        if (this.kind) {
            if (this.kind.kind_procedures[procedure_name]) {
                if (this.user === undefined) {
                    throw OnActionError.create("User not specified", procedure_name, this.kind.name)
                }
                try {
                    const { data } =  await axios.post<Entity>(this.kind.kind_procedures[procedure_name].procedure_callback, {
                        input
                    }, { headers: this.user })
                    return data
                } catch (e) {
                    throw OnActionError.create(e.response.data.message, procedure_name, this.kind.name)
                }
            } else {
                // We should reach this exception under normal condition because of pre checks while choosing strategy
                throw new Error("Entity creation was expecting a constructor but couldn't find it")
            }
        } else {
            throw OnActionError.create("Insufficient params specified", procedure_name)
        }
    }
}
