import {MongoClient,Db} from "mongodb";
import {Spec_DB_Mongo} from "./spec_db_mongo";
import ProviderDbMongo from "./provider_db_mongo";

export class MongoConnection {
    url:string;
    dbName:string;
    client:MongoClient;
    db:Db|undefined;
    specDb:Spec_DB_Mongo|undefined;
    providerDb: ProviderDbMongo|undefined;
    constructor(url:string, dbName:string) {
        this.url = url;
        this.dbName = dbName;
        this.client = new MongoClient(this.url, { useNewUrlParser: true });
        this.db = undefined;
        this.specDb = undefined;
        this.providerDb = undefined;
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

    async get_provider_db(): Promise<ProviderDbMongo> {
        if (this.providerDb !== undefined)
            return this.providerDb;
        if (this.db === undefined)
            throw new Error("Not connected");
        this.providerDb = new ProviderDbMongo(this.db);
        await this.providerDb.init();
        return this.providerDb;
    }
}