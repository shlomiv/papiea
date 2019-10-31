import { IntentfulStrategy } from "./intentful_strategy_interface"
import { Spec_DB } from "../databases/spec_db_interface"
import { Status_DB } from "../databases/status_db_interface"
import { Differ, Metadata, Spec } from "papiea-core"
import { IntentfulTask_DB } from "../databases/intentful_task_db_interface"
import { IntentfulTask } from "../tasks/task_interface"
import { IntentfulStatus } from "papiea-core/build/core"
import uuid = require("uuid")

export class DifferIntentfulStrategy extends IntentfulStrategy {
    protected differ: Differ
    protected intentfulTaskDb: IntentfulTask_DB

    constructor(specDb: Spec_DB, statusDb: Status_DB, differ: Differ, intentfulTaskDb: IntentfulTask_DB) {
        super(specDb, statusDb)
        this.differ = differ
        this.intentfulTaskDb = intentfulTaskDb
    }

    async update_entity(metadata: Metadata, spec: Spec): Promise<[Metadata, Spec]> {
        const status = await this.statusDb.get_status(metadata)
        const task: IntentfulTask = {
            uuid: uuid(),
            entity_ref: {
                uuid: metadata.uuid,
                kind: metadata.kind
            },
            diffs: [],
            spec_version: metadata.spec_version,
            status: IntentfulStatus.Pending
        }
        for (let diff of this.differ.diffs(this.kind!, spec, status)) {
            task.diffs.push(diff)
        }
        const [updatedMetadata, updatedSpec] = await this.specDb.update_spec(metadata, spec);
        return [updatedMetadata, updatedSpec]
    }
}