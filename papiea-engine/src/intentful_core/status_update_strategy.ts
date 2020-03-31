import { Status_DB } from "../databases/status_db_interface";
import { Entity_Reference, Status, Kind, Differ, Diff, IntentfulStatus } from "papiea-core";
import { IntentfulTask_DB } from "../databases/intentful_task_db_interface";
import { Spec_DB } from "../databases/spec_db_interface";
import { IntentfulTask } from "../tasks/task_interface";
import uuid = require("uuid");
import { UserAuthInfo } from "../auth/authn";

export abstract class StatusUpdateStrategy {
    statusDb: Status_DB
    kind?: Kind
    user?: UserAuthInfo

    protected constructor(statusDb: Status_DB) {
        this.statusDb = statusDb
    }

    async update(entity_ref: Entity_Reference, status: Status): Promise<any> {
        return this.statusDb.update_status(entity_ref, status);
    }

    async replace(entity_ref: Entity_Reference, status: Status): Promise<any> {
        return this.statusDb.replace_status(entity_ref, status);
    }

    setKind(kind: Kind) {
        this.kind = kind
    }

    setUser(user: UserAuthInfo) {
        this.user = user
    }
}

export class SpecOnlyUpdateStrategy extends StatusUpdateStrategy {
    constructor(statusDb: Status_DB) {
        super(statusDb)
    }

    async update(entity_ref: Entity_Reference, status: Status): Promise<any> {
        throw new Error("Cannot change status of a spec-only kind")
    }

    async replace(entity_ref: Entity_Reference, status: Status): Promise<any> {
        throw new Error("Cannot change status of a spec-only kind")
    }
}

export class BasicUpdateStrategy extends StatusUpdateStrategy {
    constructor(statusDb: Status_DB) {
        super(statusDb)
    }
}

export class DifferUpdateStrategy extends StatusUpdateStrategy {
    private readonly differ: Differ
    private readonly intentfulTaskDb: IntentfulTask_DB
    private readonly specDb: Spec_DB

    constructor(statusDb: Status_DB, specDb: Spec_DB, differ: Differ, intentfulTaskDb: IntentfulTask_DB) {
        super(statusDb)
        this.specDb = specDb
        this.differ = differ
        this.intentfulTaskDb = intentfulTaskDb
    }

    async update(entity_ref: Entity_Reference, status: Status): Promise<IntentfulTask | null> {
        let diffs: Diff[] = []
        const [metadata, spec] = await this.specDb.get_spec(entity_ref)
        for (let diff of this.differ.diffs(this.kind!, spec, status)) {
            diffs.push(diff)
        }
        await super.update(entity_ref, status)
        if (diffs.length > 0) {
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
            await this.intentfulTaskDb.save_task(task)
            return task
        }
        return null
    }

    async replace(entity_ref: Entity_Reference, status: Status) {
        return this.statusDb.replace_status(entity_ref, status);
    }
}