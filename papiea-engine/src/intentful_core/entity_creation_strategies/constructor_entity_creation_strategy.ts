import {EntityCreationResult, EntityCreationStrategy} from "./entity_creation_strategy_interface"
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
import {Validator} from "../../validator"
import {Authorizer} from "../../auth/authz"
import {ValidationError} from "../../errors/validation_error"
import deepEqual = require("deep-equal")
import uuid = require("uuid")
import {RequestContext, spanOperation} from "papiea-backend-utils"

export class ConstructorEntityCreationStrategy extends EntityCreationStrategy {
    protected differ: Differ
    protected intentWatcherDb: IntentWatcher_DB
    protected watchlistDb: Watchlist_DB

    constructor(specDb: Spec_DB, statusDb: Status_DB, graveyardDb: Graveyard_DB, watchlistDb: Watchlist_DB, validator: Validator, authorizer: Authorizer, differ: Differ, intentWatcherDb: IntentWatcher_DB) {
        super(specDb, statusDb, graveyardDb, watchlistDb, validator, authorizer)
        this.differ = differ
        this.intentWatcherDb = intentWatcherDb
        this.watchlistDb = watchlistDb
    }

    protected async save_entity(entity: Entity): Promise<[Metadata, Spec, Status]> {
        // Create increments spec version so we should check already incremented one
        await this.check_spec_version(entity.metadata, entity.metadata.spec_version + 1, entity.spec)
        const [updatedMetadata, updatedSpec] = await this.specDb.update_spec(entity.metadata, entity.spec)
        await this.statusDb.replace_status(entity.metadata, entity.status)
        return [updatedMetadata, updatedSpec, entity.status]
    }

    public async create(input: any, ctx: RequestContext): Promise<EntityCreationResult> {
        const entity = await this.invoke_constructor(`__${this.kind.name}_create`, input, ctx)
        entity.metadata = await this.create_metadata(entity.metadata ?? {})
        await this.validate_entity(entity)
        const spec_status_equal = deepEqual(entity.spec, entity.status)
        if (!spec_status_equal && this.kind.intentful_behaviour === IntentfulBehaviour.SpecOnly) {
            throw OnActionError.create("Spec-only entity constructor returned spec not matching status", "Constructor", this.kind.name)
        }
        const span = spanOperation(`save_entity_db`,
                                   ctx.tracing_ctx)
        const [created_metadata, created_spec, created_status] = await this.save_entity(entity)
        span.finish()
        let watcher: null | IntentWatcher = null
        if (!spec_status_equal && (this.kind.intentful_behaviour === IntentfulBehaviour.Differ || this.kind.intentful_behaviour === IntentfulBehaviour.Basic)) {
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
            for (let diff of this.differ.diffs(this.kind, created_spec, created_status)) {
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
        return {
            intent_watcher: watcher,
            metadata: created_metadata,
            spec: created_spec,
            status: created_status
        }
    }

    protected async invoke_constructor(procedure_name: string, input: any, ctx: RequestContext): Promise<Entity> {
        let entity: Entity
        if (this.kind) {
            const constructor = this.kind.kind_procedures[procedure_name]
            if (constructor !== undefined && constructor !== null) {
                if (this.user === undefined) {
                    throw OnActionError.create("User not specified", procedure_name, this.kind.name)
                }
                try {
                    const schemas: any = {}
                    Object.assign(schemas, constructor.argument)
                    this.validator.validate(input, Object.values(constructor.argument)[0], schemas,
                                            this.provider.allowExtraProps,
                                            Object.keys(constructor.argument)[0], "Constructor procedure")
                    const span = spanOperation(`custom_constructor`,
                                               ctx.tracing_ctx)
                    const {data} = await axios.post<Entity>(this.kind.kind_procedures[procedure_name].procedure_callback, {
                        input
                    }, {headers: {...ctx.tracing_ctx.headers, ...this.user}})
                    span.finish()
                    entity = data
                } catch (e) {
                    if (e instanceof ValidationError) {
                        throw e
                    } else {
                        throw OnActionError.create(e.response.data.message, procedure_name, this.kind.name)
                    }
                }
                if (
                    entity.spec === undefined || entity.spec === null ||
                    entity.status === undefined || entity.status === null
                ) {
                    throw OnActionError.create("Constructor didn't provide full entity", procedure_name, this.kind.name)
                }
                return entity
            } else {
                // We should not reach this exception under normal condition because of pre checks while choosing strategy
                throw new Error("Entity creation was expecting a constructor but couldn't find it")
            }
        } else {
            throw OnActionError.create("Insufficient params specified", procedure_name)
        }
    }
}
