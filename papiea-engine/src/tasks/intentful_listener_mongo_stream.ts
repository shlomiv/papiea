import { Handler, IntentfulListener } from "./intentful_listener_interface";
import { ChangeStream, Collection } from "mongodb";
import { Watchlist } from "./watchlist";
import { Entity } from "papiea-core";
import { MongoConnection } from "../databases/mongo";

export class IntentfulListenerMongoStream implements IntentfulListener {
    private entityDbCollection: Collection;
    onChange: Handler<(entity: Entity) => Promise<void>>;
    private changeStreamIterator: ChangeStream;
    private watchlist: Watchlist;
    // Maybe we should store it persistently on disk?
    private resumeToken: any | undefined

    constructor(mongoConnection: MongoConnection, watchlist: Watchlist) {
        this.entityDbCollection = mongoConnection.db!.collection("entity")
        this.changeStreamIterator = this.entityDbCollection.watch([
            { $match: { operationType: "update" } }
        ], { fullDocument: 'updateLookup', resumeAfter: this.resumeToken })
        this.onChange = new Handler()
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

    private specChanged(change_event: any): boolean {
        // TODO: removed fields?
        if (change_event.updateDescription.updatedFields.spec) {
            return true
        }
        return false
    }

    private statusChanged(change_event: any): boolean {
        // TODO: removed fields?

        // Update has changed the whole status object
        // Came in form of { updatedFields: { status: [Object] }}
        if (change_event.updateDescription.updatedFields.status) {
            return true
        }
        // Update has changed status partially
        // Came in form of { updatedFields: { 'status.x': [Object] }}
        for (let key of Object.keys(change_event.updateDescription.updatedFields)) {
            const partial_status = key.split(".")
            if (partial_status[ 0 ] === "status") {
                return true
            }
        }
        return false
    }

    private async watchCollection() {
        this.changeStreamIterator = this.entityDbCollection.watch([
            { $match: { operationType: "update" } }
        ], { fullDocument: 'updateLookup', resumeAfter: this.resumeToken })
        this.changeStreamIterator.on("change", async (change_event) => {
            console.log("On event changed")
            this.resumeToken = change_event._id
            const entity: Entity = change_event.fullDocument
            if (this.watchlist.has(entity.metadata.uuid)) {
                if (this.specChanged(change_event) || this.statusChanged(change_event)) {
                    await this.onChange.call(entity)
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