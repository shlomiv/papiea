import {MongoClient,Db} from "mongodb";

export class MongoConnection {
    url:string;
    dbName:string;
    client:MongoClient;
    constructor(url:string, dbName:string) {
        this.url = url;
        this.dbName = dbName;
        this.client = new MongoClient(this.url, { useNewUrlParser: true });
    }
    connect(cb: (error:Error|null, db?:Db) => void):void {
        this.client.connect((err, result) => {
            if (err) {
                cb(err);
                return;
            }
            cb(null, this.client.db(this.dbName));
        });
    }
    close(cb: (error?: Error) => void) {
        this.client.close(cb);
    }
}