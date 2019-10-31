import { Entity_Reference, Status } from "papiea-core"
import { IntentfulTask } from "./task_interface"
import { Handler, IntentfulListener } from "./intentful_listener_interface"
import { IntentfulTask_DB } from "../databases/intentful_task_db_interface"
import { Watchlist } from "./watchlist"
import { Metadata } from "papiea-core/build/core"
import { Status_DB } from "../databases/status_db_interface"
import MultiMap from "mnemonist/multi-map"
import { timeout } from "../utils/utils"

export class IntentfulListenerMongo implements IntentfulListener {
    private readonly intentfulTaskDb: IntentfulTask_DB
    private watchlist: Watchlist
    private statuses: MultiMap<Metadata, Status>
    private statusDb: Status_DB
    onTask: Handler<(task: IntentfulTask) => void>
    onStatus: Handler<(entity: Entity_Reference, specVersion: number, status: Status) => void>

    static async create(intentfulTaskDb: IntentfulTask_DB, statusDb: Status_DB, watchlist: Watchlist): Promise<IntentfulListener> {
        const statuses = await statusDb.list_status({})
        const listener = new IntentfulListenerMongo(intentfulTaskDb, statusDb, watchlist, MultiMap.from(statuses))
        listener._run()
        return listener
    }

    get tasks(): Set<IntentfulTask> {
        return this.watchlist.reduce((acc: Set<IntentfulTask>, entityTask) => {
            entityTask.tasks.forEach(task => {
                acc.add(task)
            })
            return acc
        }, new Set<IntentfulTask>())
    }

    constructor(intentfulTaskDb: IntentfulTask_DB, statusDb: Status_DB, watchlist: Watchlist, statuses: MultiMap<Metadata, Status>) {
        this.statusDb = statusDb
        this.intentfulTaskDb = intentfulTaskDb
        this.onTask = new Handler()
        this.onStatus = new Handler()
        this.watchlist = watchlist
        this.statuses = statuses
    }

    protected async _run() {
        let currTasks: IntentfulTask[]
        let watchlistTasks: Set<IntentfulTask>
        let currStatuses: [Metadata, Status][]
        while (true) {

            currTasks = await this.intentfulTaskDb.list_tasks({})
            watchlistTasks = this.tasks
            this.checkTasks(currTasks, watchlistTasks)

            currStatuses = await this.statusDb.list_status({})
            this.checkStatuses(currStatuses)
            await timeout(5000)
        }
    }

    checkTasks(currTasks: IntentfulTask[], watchlistTasks: Set<IntentfulTask>) {
        watchlistTasks = this.tasks
        currTasks.forEach(task => {
            if (!watchlistTasks.has(task)) {
                this.onTask.call(task)
            }
        })
    }

    checkStatuses(currStatuses: [Metadata, Status][]) {
        currStatuses.forEach(entityStatus => {
            let statuses = this.statuses.get(entityStatus[0])
            if (statuses === undefined) {
                this.onStatus.call({
                    kind: entityStatus[0].kind,
                    uuid: entityStatus[0].uuid
                } as Entity_Reference, entityStatus[0].spec_version, entityStatus[1])
            } else {
                if (!(statuses as Set<Status>).has(entityStatus[1])) {
                    this.onStatus.call({
                        kind: entityStatus[0].kind,
                        uuid: entityStatus[0].uuid
                    } as Entity_Reference, entityStatus[0].spec_version, entityStatus[1])
                }
            }
        })
        // TODO: this might not be working as expected
        this.statuses = MultiMap.from(currStatuses)
    }
}