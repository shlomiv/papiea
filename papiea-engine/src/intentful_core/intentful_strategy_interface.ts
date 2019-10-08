import { Metadata, Spec, Kind, Entity } from "papiea-core"
import { Spec_DB } from "../databases/spec_db_interface"
import { Status_DB } from "../databases/status_db_interface"
import { UserAuthInfo } from "../auth/authn"
import axios from "axios"

export abstract class IntentfulStrategy {
    protected readonly specDb: Spec_DB
    protected readonly statusDb: Status_DB
    protected kind?: Kind
    protected user?: UserAuthInfo

    protected constructor(specDb: Spec_DB, statusDb: Status_DB) {
        this.specDb = specDb
        this.statusDb = statusDb
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

    async delete_entity(metadata: Metadata): Promise<void> {
        await this.specDb.delete_spec(metadata);
        await this.statusDb.delete_status(metadata);
    }

    // Update spec and status with spec changes received
    async update(metadata: Metadata, spec: Spec): Promise<[Metadata, Spec]> {
        return this.update_entity(metadata, spec)
    }

    // Create status with spec
    async create(metadata: Metadata, spec: Spec): Promise<[Metadata, Spec]> {
        await this.dispatch("__create", { metadata, spec })
        return this.create_entity(metadata, spec)
    }

    protected async dispatch(procedure_name: string, entity: Partial<Entity>) {
        if (this.user && this.kind) {
            if (this.kind.kind_procedures[procedure_name]) {
                await axios.post(this.kind.kind_procedures[procedure_name].procedure_callback, entity, { headers: this.user })
            }
        } else {
            throw new Error("Dispatch couldn't be called, insufficient params specified")
        }
    }

    setKind(kind: Kind): void {
        this.kind = kind
    }

    setUser(user: UserAuthInfo) {
        this.user = user
    }

    // Simply delete from DB both spec and status
    async delete(metadata: Metadata): Promise<void> {
        await this.dispatch("__delete", { metadata })
        return this.delete_entity(metadata)
    }
}