import { Metadata, Spec, Kind, Entity, IntentWatcher } from "papiea-core"
import { Spec_DB } from "../../databases/spec_db_interface"
import { Status_DB } from "../../databases/status_db_interface"
import { UserAuthInfo } from "../../auth/authn"
import axios from "axios"
import { OnActionError } from "../../errors/on_action_error";
import { Graveyard_DB } from "../../databases/graveyard_db_interface"
import {
    GraveyardConflictingEntityError
} from "../../databases/utils/errors"
import {RequestContext, spanOperation} from "papiea-backend-utils"

export abstract class IntentfulStrategy {
    protected readonly specDb: Spec_DB
    protected readonly statusDb: Status_DB
    protected readonly graveyardDb: Graveyard_DB
    protected kind?: Kind
    protected user?: UserAuthInfo

    protected constructor(specDb: Spec_DB, statusDb: Status_DB, graveyardDb: Graveyard_DB) {
        this.specDb = specDb
        this.statusDb = statusDb
        this.graveyardDb = graveyardDb
    }

    protected async check_spec_version(metadata: Metadata, spec_version: number, spec: Spec) {
        const exists = await this.graveyardDb.check_spec_version_exists(metadata, spec_version)
        if (exists) {
            const highest_spec_version = await this.graveyardDb.get_highest_spec_version(metadata)
            metadata.spec_version = spec_version
            throw new GraveyardConflictingEntityError(metadata, spec, highest_spec_version)
        }
    }

    async update_entity(metadata: Metadata, spec: Spec): Promise<[Metadata, Spec]> {
        await this.check_spec_version(metadata, metadata.spec_version, spec)
        const [updatedMetadata, updatedSpec] = await this.specDb.update_spec(metadata, spec);
        await this.statusDb.update_status(metadata, spec)
        return [updatedMetadata, updatedSpec]
    }

    async delete_entity(entity: Entity): Promise<void> {
        await this.graveyardDb.dispose(entity)
    }

    async update(metadata: Metadata, spec: Spec, ctx: RequestContext): Promise<IntentWatcher | null> {
        await this.update_entity(metadata, spec)
        return null
    }

    protected async invoke_destructor(procedure_name: string, entity: Partial<Entity>, ctx: RequestContext): Promise<void> {
        if (this.kind) {
            if (this.kind.kind_procedures[procedure_name]) {
                if (this.user === undefined) {
                    throw OnActionError.create("User not specified", procedure_name, this.kind.name)
                }
                try {
                    const span = spanOperation(`destructor`,
                                               ctx.tracing_ctx,
                                               {entity_uuid: entity.metadata?.uuid})
                    const { data } =  await axios.post(this.kind.kind_procedures[procedure_name].procedure_callback, {
                        input: entity
                    }, { headers: this.user })
                    span.finish()
                    return data
                } catch (e) {
                    throw OnActionError.create(e.response.data.message, procedure_name, this.kind.name)
                }
            }
        } else {
            throw OnActionError.create("Insufficient params specified", procedure_name)
        }
    }

    setKind(kind: Kind): void {
        this.kind = kind
    }

    setUser(user: UserAuthInfo) {
        this.user = user
    }

    async delete(entity: Entity, ctx: RequestContext): Promise<void> {
        await this.invoke_destructor(`__${entity.metadata.kind}_delete`, { metadata: entity.metadata }, ctx)
        const span = spanOperation(`delete_entity_db`,
                                   ctx.tracing_ctx,
                                   {entity_uuid: entity.metadata.uuid})
        await this.delete_entity(entity)
        span.finish()
    }
}
