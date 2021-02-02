import { Spec_DB } from "../../databases/spec_db_interface"
import { Status_DB } from "../../databases/status_db_interface"
import { IntentfulStrategy } from "./intentful_strategy_interface"
import { Metadata, Spec, Entity, IntentWatcher } from "papiea-core"
import { Graveyard_DB } from "../../databases/graveyard_db_interface"
import {RequestContext, spanOperation} from "papiea-backend-utils"

export class SpecOnlyIntentfulStrategy extends IntentfulStrategy {
    constructor(specDb: Spec_DB, statusDb: Status_DB, graveyardDb: Graveyard_DB) {
        super(specDb, statusDb, graveyardDb)
    }

    // Replace spec and status with spec changes received
    async update_entity(metadata: Metadata, spec: Spec): Promise<Spec> {
        const [updatedMetadata, updatedSpec] = await this.specDb.update_spec(metadata, spec);
        await this.statusDb.replace_status(metadata, spec)
        return [updatedMetadata, updatedSpec]
    }

    // Update spec and status with spec changes received
    async update(metadata: Metadata, spec: Spec, ctx: RequestContext): Promise<IntentWatcher | null> {
        const span = spanOperation(`update_entity_db`,
                                   ctx.tracing_ctx,
                                   {entity_uuid: metadata.uuid})
        await this.update_entity(metadata, spec)
        span.finish()
        return null
    }
}
