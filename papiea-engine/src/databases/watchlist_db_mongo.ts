import { Collection, Db } from "mongodb";
import { Logger } from "../logger_interface";
import { Watchlist_DB } from "./watchlist_db_interface";
import { Watchlist } from "../tasks/watchlist";

type WatchlistResult = {
    id: number
    watchlist: Watchlist
}

export class Watchlist_Db_Mongo implements Watchlist_DB {
    collection: Collection;
    logger: Logger

    constructor(logger: Logger, db: Db) {
        this.collection = db.collection("watchlist");
        this.logger = logger;
    }

    async init(): Promise<void> {
        await this.collection.createIndex(
            { "id": 1 },
            { name: "watchlist_id", unique: true }
        );
    }

    async update_watchlist(watchlist: Watchlist): Promise<void> {
        const result = await this.collection.updateOne({
            "id": 1,
        }, {
            $set: {
                id: 1,
                watchlist: watchlist
            }
        }, {
            upsert: true
        });
        if (result.result.n !== 1) {
            throw new Error(`Amount of updated entries doesn't equal to 1: ${result.result.n}`)
        }
    }

    async get_watchlist(): Promise<Watchlist> {
        const result: WatchlistResult | null = await this.collection.findOne({
            "id": 1,
        });
        if (result === null) {
            throw new Error("Not found")
        }
        return new Map(result.watchlist)
    }
}
