import { Collection, Db } from "mongodb"
import { SortParams } from "../entity/entity_api_impl"
import { Logger } from "../logger_interface"
import { Task_DB } from "./task_db_interface"
import { Task } from "../tasks/task_interface"
import { Provider, Kind } from "papiea-core"

export class Task_DB_Mongo implements Task_DB {
    collection: Collection;
    logger: Logger;

    constructor(logger: Logger, db: Db) {
        this.collection = db.collection("entity");
        this.logger = logger;
    }

        async init(): Promise<void> {
        try {
            await this.collection.createIndex(
                { "handler_url": 1 },
                { unique: true },
            );
            await this.collection.createIndex(
                { "uuid": 1 },
                { name: "uuid", unique: true },
            )
        } catch (err) {
            throw err
        }
    }

    async create_task(task: Task): Promise<void> {
        await this.collection.insertOne(task);
    }

    async get_task(uuid: string): Promise<Task> {
        const result: Task | null = await this.collection.findOne({
            "uuid": uuid,
            "deleted_at": null
        });
        if (result === null) {
            throw new Error("key not found");
        }
        return result;
    }

    async list_provider_tasks(provider: Provider): Promise<[Kind, Task[]][]> {
        // TODO: Need to add a JOIN analogue to match Provider kinds & Tasks
        return []
    }

    async list_kind_tasks(kind: Kind): Promise<Task[]> {
        const result = await this.collection.find({
            "diff.kind": kind.name
        })
        return result.toArray()
    }

    async update_task(uuid: string, delta: Partial<Task>): Promise<void> {
        const result = await this.collection.updateOne({
            uuid
        }, {
            $set: delta
        })
        if (result.result.n === undefined || result.result.ok !== 1) {
            throw new Error("Failed to inactivate key");
        }
        if (result.result.n !== 1 && result.result.n !== 0) {
            throw new Error(`Amount of key inactivated must be 0 or 1, found: ${result.result.n}`);
        }
    }


    async list_tasks(fields_map: any, sortParams?: SortParams): Promise<Task[]> {
        const filter: any = Object.assign({}, fields_map);
        return await this.collection.find(filter).toArray();
    }

    async delete_task(uuid: string): Promise<void> {
        const result = await this.collection.deleteOne({
            uuid
        })
        if (result.result.n === undefined || result.result.ok !== 1) {
            throw new Error("Failed to delete a task");
        }
        if (result.result.n !== 1 && result.result.n !== 0) {
            throw new Error(`Amount of deleted task must be 0 or 1, found: ${result.result.n}`);
        }
        return;
    }
}
