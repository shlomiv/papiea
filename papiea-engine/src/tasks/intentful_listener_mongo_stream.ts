import { Handler, IntentfulListener } from "./intentful_listener_interface";
import { ChangeStream, Collection } from "mongodb";
import { EntryReference, Watchlist } from "./watchlist";
import { Spec, Status, Entity } from "papiea-core";
import { MongoConnection } from "../databases/mongo";

export class IntentfulListenerMongoStream implements IntentfulListener {
    private entityDbCollection: Collection;
    onSpec: Handler<(entity: EntryReference, specVersion: number, spec: Spec) => Promise<void>>;
    onStatus: Handler<(entity: EntryReference, status: Status) => Promise<void>>;
    private changeStreamIterator: ChangeStream;
    private watchlist: Watchlist;
    // Maybe we should store it persistently on disk?
    private resumeToken: any | undefined

    constructor(mongoConnection: MongoConnection, watchlist: Watchlist) {
        this.entityDbCollection = mongoConnection.db!.collection("entity")
        this.changeStreamIterator = this.entityDbCollection.watch([
            { $match: { operationType: "update" } }
        ], { fullDocument: 'updateLookup', resumeAfter: this.resumeToken })
        this.onSpec = new Handler()
        this.onStatus = new Handler()
        this.watchlist = watchlist
    }

    public async run() {
        try {
            await this._run()
        } catch (e) {
            console.error(e)
            throw e
        }
    }

    private async watchCollection() {
        this.changeStreamIterator = this.entityDbCollection.watch([
            { $match: { operationType: "update" } }
        ], { fullDocument: 'updateLookup', resumeAfter: this.resumeToken })
        this.changeStreamIterator.on("change", async (next) => {
            this.resumeToken = next._id
            const entity: Entity = next.fullDocument
            if (this.watchlist.has(entity.metadata.uuid)) {
                const entry_reference: EntryReference = {
                    provider_reference: {
                        provider_prefix: entity.metadata.provider_prefix,
                        provider_version: entity.metadata.provider_version
                    },
                    entity_reference: {
                        uuid: entity.metadata.uuid,
                        kind: entity.metadata.kind
                    }
                }
                // TODO: removed fields?
                console.log(next)
                if (next.updateDescription.updatedFields.spec) {
                    await this.onSpec.call(entry_reference, entity.metadata.spec_version, entity.spec)
                } else {
                    if (next.updateDescription.updatedFields.status) {
                        await this.onStatus.call(entry_reference, entity.status)
                        return
                    }
                    for (let key of Object.keys(next.updateDescription.updatedFields)) {
                        const partial_status = key.split(".")
                        if (partial_status[ 0 ] === "status") {
                            await this.onStatus.call(entry_reference, entity.status)
                            return
                        }
                    }
                }
            }
        }).on("error", async (err) => {
            await this.watchCollection()
        })
    }

    private async _run(): Promise<void> {
        await this.watchCollection()
    }
}