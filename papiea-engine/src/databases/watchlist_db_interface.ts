import { Watchlist } from "../intentful_engine/watchlist"

export interface Watchlist_DB {

    update_watchlist(watchlist: Watchlist): Promise<void>

    get_watchlist(): Promise<Watchlist>

}
