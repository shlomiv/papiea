import { Entity_Reference, Status, Metadata } from "papiea-core"
import { IntentfulTask } from "./task_interface"
import { Handler, IntentfulListener } from "./intentful_listener_interface"
import { IntentfulTask_DB } from "../databases/intentful_task_db_interface"
import { Watchlist } from "./watchlist"
import { Status_DB } from "../databases/status_db_interface"
// @ts-ignore
import { Map, Set } from "immutable"
import { timeout } from "../utils/utils"

export class IntentfulListenerMongo implements IntentfulListener {
    private readonly intentfulTaskDb: IntentfulTask_DB
    private watchlist: Watchlist
    private statuses: Map<string, Set<string>>
    private statusDb: Status_DB
    onTask: Handler<(task: IntentfulTask) => Promise<void>>
    onStatus: Handler<(entity: Entity_Reference, specVersion: number, status: Status) => Promise<void>>

    static async create(intentfulTaskDb: IntentfulTask_DB, statusDb: Status_DB, watchlist: Watchlist): Promise<IntentfulListener> {
        let statusMap = Map<string, Set<string>>()
        const statuses = await statusDb.list_status({})
        statuses.forEach(([metadata, status]) => {
            statusMap = statusMap.updateIn([metadata.uuid], Set<string>(), (currentStatus: Set<Status>) => currentStatus.add(JSON.stringify(status)))
        })
        const listener = new IntentfulListenerMongo(intentfulTaskDb, statusDb, watchlist, statusMap)
        listener._run()
        return listener
    }

    constructor(intentfulTaskDb: IntentfulTask_DB, statusDb: Status_DB, watchlist: Watchlist, statuses: Map<string, Set<string>>) {
        this.statusDb = statusDb
        this.intentfulTaskDb = intentfulTaskDb
        this.onTask = new Handler()
        this.onStatus = new Handler()
        this.watchlist = watchlist
        this.statuses = statuses
    }

    protected async _run() {
        let updatedTasks: IntentfulTask[]
        let updatedStatuses: [Metadata, Status][]
        while (true) {
            updatedTasks = await this.intentfulTaskDb.list_tasks({})
            this.checkTasks(updatedTasks, this.watchlist.tasks)

            updatedStatuses = await this.statusDb.get_statuses_by_ref(updatedTasks.map(task => task.entity_ref))
            this.checkStatuses(updatedStatuses)
            await timeout(5000)
        }
    }

    async checkTasks(updatedTasks: IntentfulTask[], watchlistTasks: Set<IntentfulTask>) {
        for (let task of updatedTasks) {
            if (!watchlistTasks.has(task)) {
                await this.onTask.call(task)
            }
        }
    }

    async checkStatuses(updatedStatuses: [Metadata, Status][]) {
        for (let [metadata, status] of updatedStatuses) {
            let statuses = this.statuses.get(metadata.uuid)
            if (statuses === undefined || !statuses.has(JSON.stringify(status))) {
                await this.onStatus.call({
                        kind: metadata.kind,
                        uuid: metadata.uuid
                    } as Entity_Reference
                    , metadata.spec_version
                    , status)
            }
        }
        updatedStatuses.forEach(([metadata, status]) => {
            this.statuses = this.statuses.updateIn([metadata.uuid], (currentStatus: Set<Status>) => currentStatus.add(JSON.stringify(status)))
        })
    }
}