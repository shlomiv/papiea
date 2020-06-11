import { Status_DB } from "./status_db_interface";
import { Db, Collection } from "mongodb";
import { datestringToFilter } from "./utils/date";
// import { encode } from "mongo-dot-notation-tool"
import { Entity_Reference, Status, Metadata, Entity } from "papiea-core";
import { SortParams } from "../entity/entity_api_impl";
import { Logger } from "papiea-backend-utils";
import { deepMerge, isEmpty } from "../utils/utils"
import { build_filter_query } from "./utils/filtering"

// Shlomi: Moved encode here from mongo-dot-notation-tool and fixed it to not venture into vectors
// Need to add tests to this
function encode(value: any, keyChain: string[], result: any) {
    const isObject = (value: any)=> value && value.toString() === '[object Object]'
    const isArray = (value: any)=>  Array.isArray(value);
    let _key:any;

    if (!keyChain) {
        keyChain = [];
    }

    if (isArray(value)) {
        if (!result) {
            result = [];
        }

        for (var i = 0; i < value.length; i++) {
            result[i] = value[i];
        }
    } else if (isObject(value)) {
        if (!result) {
            result = {};
        }

        Object.keys(value).forEach(function (key) {
            let _keyChain = ([] as string[]).concat(keyChain);
            _keyChain.push(key);

            if (key.charAt(0) === '$') {
                if (isArray(value[key])) {
                    result[key] = value[key];
                } else if (isObject(value[key])) {
                    if (keyChain.length) {
                        _key = keyChain.join('.');
                        if (!result[_key]) {
                            result[_key] = {};
                        }
                        encode(value[key], [key], result[_key]);
                    } else {
                        encode(value[key], [key], result);
                    }
                } else {
                    _key = keyChain.join('.');
                    let _o: any = {};
                    _o[key] = value[key] as any;
                    if (result[_key]) {
                        Object.assign(result[_key], _o);
                    } else {
                        result[_key] = _o;
                    }
                }
            } else {
                if (isArray(value[key])) {
                    _key = _keyChain.join('.');
                    result[_key] = [];
                    encode(value[key], [], result[_key]);
                } else if (isObject(value[key])) {
                    encode(value[key], _keyChain, result);
                } else {
                    result[_keyChain.join('.')] = value[key];
                }
            }
        });
    } else {
        result = value;
    }

    return result;
}

const dotnotation = (x:any)=>encode(x, [], undefined)

export class Status_DB_Mongo implements Status_DB {
    collection: Collection;
    logger: Logger

    constructor(logger: Logger, db: Db) {
        this.collection = db.collection("entity");
        this.logger = logger;
    }

    async init(): Promise<void> {

    }

    async replace_status(entity_ref: Entity_Reference, status: Status): Promise<void> {
        const result = await this.collection.updateOne({
            "metadata.uuid": entity_ref.uuid,
            "metadata.kind": entity_ref.kind
        }, {
                $set: {
                    "status": status
                },
                $setOnInsert: {
                    "metadata.created_at": new Date()
                }
            }, {
                upsert: true
            });
        if (result.result.n !== 1) {
            throw new Error(`Amount of updated entries doesn't equal to 1: ${result.result.n}`)
        }
    }

    async update_status(entity_ref: Entity_Reference, status: Status): Promise<void> {
        const partial_status_query = dotnotation({"status": status});
        const result = await this.collection.updateOne({
            "metadata.uuid": entity_ref.uuid,
            "metadata.kind": entity_ref.kind
        }, {
                $set: partial_status_query
            });
        if (result.result.n !== 1) {
            throw new Error(`Amount of updated entries doesn't equal to 1: ${result.result.n}`)
        }
    }

    async get_status(entity_ref: Entity_Reference): Promise<[Metadata, Status]> {
        const result: Entity | null = await this.collection.findOne({
            "metadata.uuid": entity_ref.uuid,
            "metadata.kind": entity_ref.kind
        });
        if (result === null) {
            throw new Error("Status Not found")
        }
        return [result.metadata, result.status]
    }

    async get_statuses_by_ref(entity_refs: Entity_Reference[]): Promise<[Metadata, Status][]> {
        const ids = entity_refs.map(ref => ref.uuid)
        const result = await this.collection.find({
            "metadata.uuid": {
                $in: ids
            }
        }).toArray();
        return result.map((x: any): [Metadata, Status] => {
            if (x.spec !== null) {
                return [x.metadata, x.status]
            } else {
                throw new Error("No valid entities found");
            }
        });
    }

    async list_status(fields_map: any, exact_match: boolean, sortParams?: SortParams): Promise<([Metadata, Status])[]> {
        const filter = build_filter_query(fields_map, exact_match)
        let result: any[];
        if (sortParams) {
            result = await this.collection.find(filter).sort(sortParams).toArray();
        } else {
            result = await this.collection.find(filter).toArray();
        }
        return result.map((x: any): [Metadata, Status] => {
            if (x.status !== null) {
                return [x.metadata, x.status]
            } else {
                throw new Error("No entities found")
            }
        });
    }

    async list_status_in(filter_list: any[], field_name: string = "metadata.uuid"): Promise<([Metadata, Status])[]> {
        const result = await this.collection.find({ [field_name]: { $in: filter_list } }).sort({ "metadata.uuid": 1 }).toArray();
        return result.map((x: any): [Metadata, Status] => {
            if (x.status !== null) {
                return [x.metadata, x.status]
            } else {
                throw new Error("No valid entities found");
            }
        });
    }

    async delete_status(entity_ref: Entity_Reference): Promise<void> {
        const result = await this.collection.updateOne({
            "metadata.uuid": entity_ref.uuid,
            "metadata.kind": entity_ref.kind
        }, {
                $set: {
                    "metadata.deleted_at": new Date()
                }
            });
        if (result.result.n === undefined || result.result.ok !== 1) {
            throw new Error("Failed to remove status");
        }
        if (result.result.n !== 1 && result.result.n !== 0) {
            throw new Error("Amount of entities must be 0 or 1");
        }
        return;
    }
}
