import {MongoClient,Db} from "mongodb";
import {Spec_DB_Mongo} from "./spec_db_mongo";
import {Status_DB_Mongo} from "./status_db_mongo";

export class MongoConnection {
    url:string;
    dbName:string;
    client:MongoClient;
    db:Db|undefined;
    specDb:Spec_DB_Mongo|undefined;
    statusDb:Status_DB_Mongo|undefined;
    constructor(url:string, dbName:string) {
        this.url = url;
        this.dbName = dbName;
        this.client = new MongoClient(this.url, { useNewUrlParser: true });
        this.db = undefined;
        this.specDb = undefined;
        this.statusDb = undefined;
    }

    connect(cb: (error?:Error) => void):void {
        this.client.connect((err, result) => {
            if (err)
                return cb(err);
            this.db = this.client.db(this.dbName);
            cb();
        });
    }

    close(cb: (error?: Error) => void) {
        this.client.close(true, cb);
    }

    get_spec_db(cb: (error: Error|null, specDb?: Spec_DB_Mongo) => void):void {
        if (this.specDb !== undefined)
            return cb(null, this.specDb);
        if (this.db === undefined)
            return cb(new Error("Not connected"));
        this.specDb = new Spec_DB_Mongo(this.db);
        this.specDb.init(err => {
            if (err)
                return cb(err);
            cb(null, this.specDb);
        });
    }

    get_status_db(cb: (error: Error|null, statusDb?: Status_DB_Mongo) => void):void {
        if (this.statusDb !== undefined)
            return cb(null, this.statusDb);
        if (this.db === undefined)
            return cb(new Error("Not connected"));
        this.statusDb = new Status_DB_Mongo(this.db);
        this.statusDb.init(err => {
            if (err)
                return cb(err);
            cb(null, this.statusDb);
        });
    }
}