import { Metadata, Spec, Kind, Entity } from "papiea-core"
import { Spec_DB } from "../../databases/spec_db_interface"
import { Status_DB } from "../../databases/status_db_interface"
import { UserAuthInfo } from "../../auth/authn"
import axios from "axios"
import { IntentWatcher } from "../../intentful_engine/intent_interface"
import { OnActionError } from "../../errors/on_action_error";
import { Graveyard_DB } from "../../databases/graveyard_db_interface"

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

    async update_entity(metadata: Metadata, spec: Spec): Promise<[Metadata, Spec]> {
        const [updatedMetadata, updatedSpec] = await this.specDb.update_spec(metadata, spec);
        await this.statusDb.update_status(metadata, spec)
        return [updatedMetadata, updatedSpec]
    }

    async create_entity(metadata: Metadata, spec: Spec): Promise<[Metadata, Spec]> {
        const [updatedMetadata, updatedSpec] = await this.specDb.update_spec(metadata, spec);
        await this.statusDb.replace_status(metadata, spec)
        return [updatedMetadata, updatedSpec]
    }

    async delete_entity(entity: Entity): Promise<void> {
        await this.graveyardDb.dispose(entity)
    }

    async update(metadata: Metadata, spec: Spec): Promise<IntentWatcher | null> {
        await this.update_entity(metadata, spec)
        return null
    }

    async create(metadata: Metadata, spec: Spec): Promise<[Metadata, Spec]> {
        const entity = this.create_entity(metadata, spec)
        await this.dispatch(`__${metadata.kind}_create`, { metadata, spec })
        return entity
    }

    protected async dispatch(procedure_name: string, entity: Partial<Entity>): Promise<any> {
        if (this.kind) {
            if (this.kind.kind_procedures[procedure_name]) {
                if (this.user === undefined) {
                    throw OnActionError.create("User not specified", procedure_name, this.kind.name)
                }
                try {
                    const { data } =  await axios.post(this.kind.kind_procedures[procedure_name].procedure_callback, {
                        input: entity
                    }, { headers: this.user })
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

    async delete(entity: Entity): Promise<void> {
        await this.dispatch(`__${entity.metadata.kind}_delete`, { metadata: entity.metadata })
        return this.delete_entity(entity)
    }
}
