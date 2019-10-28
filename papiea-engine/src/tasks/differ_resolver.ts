// [[file:~/work/papiea-js/Papiea-design.org::*/src/tasks/task_manager_interface.ts][/src/tasks/task_manager_interface.ts:1]]
import { Diff, Entity_Reference, Kind, Spec, Status } from "papiea-core";
import { Papiea } from "../papiea";
import { IntentfulTask } from "./task_interface"
import { timeout } from "../utils/utils"
import { IntentfulTask_DB_Mongo } from "../databases/intentful_task_db_mongo"
import { Entity, IntentfulStatus } from "papiea-core"
import Queue from "mnemonist/queue"
import axios from "axios"
import { Spec_DB } from "../databases/spec_db_interface"
import { Status_DB } from "../databases/status_db_interface"
import MultiMap from "mnemonist/multi-map"
import { RedisClient } from "redis"
import { IntentfulProcessor } from "./intentful_request_handler"

// This should be run in a different process
// TODO: provide optimized Data Structures
export class DifferResolver {
    // This should be a separate connection from main Papiea functions
    protected readonly intentfulTaskDb: IntentfulTask_DB_Mongo
    protected readonly specDb: Spec_DB
    protected readonly statusDb: Status_DB

    protected _entitiesInProgress: MultiMap<Entity_Reference, IntentfulTask>
    private intentfulProcessor: IntentfulProcessor

    constructor(taskDb: IntentfulTask_DB_Mongo, specDb: Spec_DB, statusDb: Status_DB, redisClient: RedisClient) {
        this.intentfulTaskDb = taskDb
        this.specDb = specDb
        this.statusDb = statusDb
        this._entitiesInProgress = new MultiMap<Entity_Reference, IntentfulTask>(Set)
        this.intentfulProcessor = IntentfulProcessor.create(redisClient)
        this.intentfulProcessor.onTask = this.onTask
        this.intentfulProcessor.onStatus = this.onStatus
    }

    public async run(delay: number) {
        try {
            await this._run(delay)
        } catch (e) {
            throw e
        }
    }

    private async _run(delay: number) {
        while (true) {
            await timeout(delay)
            this.launchTasks()
            this.clearFinishedTasks()
        }
    }

    public clearFinishedTasks() {

    }

    public async launchTasks() {

    }

    public onTask(task: IntentfulTask) {
        if (this._entitiesInProgress.has(task.entity_ref)) {
            this._entitiesInProgress.set(task.entity_ref, task)
        } else {
            this._entitiesInProgress.set(task.entity_ref, task)
            task.status = IntentfulStatus.Active
            // TODO: start provider handler
        }
    }

    protected onStatus(entity: Entity_Reference, specVersion: number, status: Status) {
        const tasks = this._entitiesInProgress.get(entity)
        tasks!.forEach((task: IntentfulTask) => {
            // TODO: change the task's status if the diff has changed
        })
    }
}