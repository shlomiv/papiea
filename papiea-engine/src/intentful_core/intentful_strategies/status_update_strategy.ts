import { Entity_Reference, Status, Kind, Differ, Diff, Provider_Entity_Reference } from "papiea-core";
import { Status_DB } from "../../databases/status_db_interface";
import { UserAuthInfo } from "../../auth/authn";
import { Spec_DB } from "../../databases/spec_db_interface";
import { Watchlist_DB } from "../../databases/watchlist_db_interface";
import { create_entry } from "../../intentful_engine/watchlist";
import {RequestContext, spanOperation} from "papiea-backend-utils"

export abstract class StatusUpdateStrategy {
    statusDb: Status_DB
    kind?: Kind
    user?: UserAuthInfo

    protected constructor(statusDb: Status_DB) {
        this.statusDb = statusDb
    }

    async update(entity_ref: Provider_Entity_Reference, status: Status, ctx: RequestContext): Promise<any> {
        return this.statusDb.update_status(entity_ref, status);
    }

    async replace(entity_ref: Provider_Entity_Reference, status: Status, ctx: RequestContext): Promise<any> {
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
    private readonly watchlistDb: Watchlist_DB
    private readonly specDb: Spec_DB

    constructor(statusDb: Status_DB, specDb: Spec_DB, differ: Differ, watchlistDb: Watchlist_DB) {
        super(statusDb)
        this.specDb = specDb
        this.differ = differ
        this.watchlistDb = watchlistDb
    }

    async update(entity_ref: Provider_Entity_Reference, status: Status, ctx: RequestContext): Promise<void> {
        let diffs: Diff[] = []
        const getSpecSpan = spanOperation(`get_spec_db`,
                                   ctx.tracing_ctx)
        const [metadata, spec] = await this.specDb.get_spec(entity_ref)
        getSpecSpan.finish()
        for (let diff of this.differ.diffs(this.kind!, spec, status)) {
            diffs.push(diff)
        }
        const watchlist = await this.watchlistDb.get_watchlist()
        const ent = create_entry(metadata)
        if (!watchlist.has(ent)) {
            watchlist.set([ent, []])
            await this.watchlistDb.update_watchlist(watchlist)
        }
        const span = spanOperation(`update_status_db`,
                                   ctx.tracing_ctx)
        await super.update(entity_ref, status, ctx)
        span.finish()
    }

    async replace(entity_ref: Provider_Entity_Reference, status: Status, ctx: RequestContext) {
        const span = spanOperation(`replace_status_db`,
                                   ctx.tracing_ctx)
        await this.statusDb.replace_status(entity_ref, status);
        span.finish()
    }
}
