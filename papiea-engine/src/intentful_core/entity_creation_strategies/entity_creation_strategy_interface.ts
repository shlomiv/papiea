import {Spec_DB} from "../../databases/spec_db_interface"
import {Status_DB} from "../../databases/status_db_interface"
import {Graveyard_DB} from "../../databases/graveyard_db_interface"
import {
    Action,
    Entity,
    IntentWatcher,
    Kind,
    Metadata,
    Provider,
    Spec,
    Status
} from "papiea-core"
import {ConflictingEntityError, GraveyardConflictingEntityError} from "../../databases/utils/errors"
import {UserAuthInfo} from "../../auth/authn"
import {Watchlist_DB} from "../../databases/watchlist_db_interface"
import {Validator} from "../../validator"
import uuid = require("uuid")
import {Authorizer} from "../../auth/authz"
import {RequestContext} from "papiea-backend-utils"

export interface EntityCreationResult {
    intent_watcher: IntentWatcher | null,
    metadata: Metadata,
    spec: Spec,
    status: Status | null
}

export abstract class EntityCreationStrategy {
    protected readonly specDb: Spec_DB
    protected readonly statusDb: Status_DB
    protected readonly graveyardDb: Graveyard_DB
    protected readonly watchlistDb: Watchlist_DB
    protected readonly validator: Validator
    protected readonly authorizer: Authorizer
    protected kind!: Kind
    protected user!: UserAuthInfo
    protected provider!: Provider


    protected constructor(specDb: Spec_DB, statusDb: Status_DB, graveyardDb: Graveyard_DB, watchlistDb: Watchlist_DB, validator: Validator, authorizer: Authorizer) {
        this.specDb = specDb
        this.statusDb = statusDb
        this.graveyardDb = graveyardDb
        this.watchlistDb = watchlistDb
        this.validator = validator
        this.authorizer = authorizer
    }

    protected async check_spec_version(metadata: Metadata, spec_version: number, spec: Spec) {
        const exists = await this.graveyardDb.check_spec_version_exists(metadata, spec_version)
        if (exists) {
            const highest_spec_version = await this.graveyardDb.get_highest_spec_version(metadata)
            metadata.spec_version = spec_version
            throw new GraveyardConflictingEntityError(metadata, spec, highest_spec_version)
        }
    }

    protected async get_existing_entities(provider: Provider, uuid: string, kind_name: string): Promise<[Metadata, Spec, Status] | []> {
        try {
            const result_spec = await this.specDb.list_specs({ metadata: { uuid: uuid, kind: kind_name, provider_version: provider.version, provider_prefix: provider.prefix, deleted_at: null } }, false)
            const result_status = await this.statusDb.list_status({ metadata: { uuid: uuid, kind: kind_name, provider_version: provider.version, provider_prefix: provider.prefix, deleted_at: null } }, false)
            if (result_spec.length !== 0 || result_status.length !== 0) {
                return [result_spec[0][0], result_spec[0][1], result_status[0][1]]
            } else {
                return []
            }
        } catch (e) {
            // Hiding details of the error for security reasons
            // since it is not supposed to occur under normal circumstances
            throw new Error("uuid is not valid")
        }
    }

    protected async create_metadata(request_metadata: Metadata): Promise<Metadata> {
        request_metadata.kind = this.kind.name
        request_metadata.provider_prefix = this.provider.prefix
        request_metadata.provider_version = this.provider.version
        if (!request_metadata.uuid) {
            if (this.kind.uuid_validation_pattern === undefined) {
                request_metadata.uuid = uuid();
            } else {
                throw new Error("Uuid is not provided, but supposed to be since validation pattern is specified")
            }
        } else {
            const result = await this.get_existing_entities(this.provider, request_metadata.uuid, request_metadata.kind)
            if (result.length !== 0) {
                const [metadata, spec, status] = result
                throw new ConflictingEntityError("An entity with this uuid already exists", metadata, spec, status)
            }
        }
        if (request_metadata.spec_version === undefined || request_metadata.spec_version === null) {
            let spec_version = await this.graveyardDb.get_highest_spec_version(
                {
                    provider_prefix: request_metadata.provider_prefix,
                    kind: request_metadata.kind,
                    provider_version: request_metadata.provider_version,
                    uuid: request_metadata.uuid
                })
            request_metadata.spec_version = spec_version
        }
        return request_metadata
    }

    protected validate_entity(entity: Entity) {
        this.validator.validate_metadata_extension(this.provider.extension_structure, entity.metadata, this.provider.allowExtraProps);
        this.validator.validate_spec(entity.spec, this.kind, this.provider.allowExtraProps)
        this.validator.validate_uuid(this.kind, entity.metadata.uuid)
        this.validator.validate_status(this.provider, entity.metadata, entity.status)
    }

    protected async check_permission(entity: Entity) {
        await this.authorizer.checkPermission(this.user, {"metadata": entity.metadata}, Action.Create, this.provider);
    }

    protected async create_entity(metadata: Metadata, spec: Spec): Promise<[Metadata, Spec]> {
        // Create increments spec version so we should check already incremented one
        await this.check_spec_version(metadata, metadata.spec_version + 1, spec)
        const [updatedMetadata, updatedSpec] = await this.specDb.update_spec(metadata, spec);
        await this.statusDb.replace_status(metadata, spec)
        return [updatedMetadata, updatedSpec]
    }

    abstract create(input: unknown, ctx: RequestContext): Promise<EntityCreationResult>

    setKind(kind: Kind): void {
        this.kind = kind
    }

    setUser(user: UserAuthInfo) {
        this.user = user
    }

    setProvider(provider: Provider) {
        this.provider = provider
    }
}
