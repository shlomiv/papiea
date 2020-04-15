import axios from "axios";
import { promisify } from "util"
import { MongoClient, Db } from "mongodb";
import { Spec_DB_Mongo } from "./spec_db_mongo";
import { Status_DB_Mongo } from "./status_db_mongo";
import { Provider_DB_Mongo } from "./provider_db_mongo";
import { S2S_Key_DB_Mongo } from "./s2skey_db_mongo";
import { SessionKeyDbMongo } from "./session_key_db_mongo"
import { Logger } from "../logger_interface"
import { IntentfulTask_DB_Mongo } from "./intentful_task_db_mongo"
import { Watchlist_Db_Mongo } from "./watchlist_db_mongo";
import { timeout } from "../utils/utils";
import { exceptions } from "winston";
const fs = require('fs'),
    url = require('url');

const exists = promisify(fs.access);

export class MongoConnection {
    url: string;
    dbName: string;
    client: MongoClient;
    db: Db | undefined;
    specDb: Spec_DB_Mongo | undefined;
    providerDb: Provider_DB_Mongo | undefined;
    statusDb: Status_DB_Mongo | undefined;
    s2skeyDb: S2S_Key_DB_Mongo | undefined;
    sessionKeyDb: SessionKeyDbMongo | undefined
    intentfulTaskDb: IntentfulTask_DB_Mongo | undefined
    watchlistDb: Watchlist_Db_Mongo | undefined;

    constructor(url: string, dbName: string) {
        this.url = url;
        this.dbName = dbName;
        this.client = new MongoClient(this.url, {
            useNewUrlParser: true,
            reconnectInterval: 2000,
            reconnectTries: 60,
            autoReconnect: true
        });
        this.db = undefined;
        this.specDb = undefined;
        this.providerDb = undefined;
        this.statusDb = undefined;
        this.s2skeyDb = undefined;
        this.intentfulTaskDb = undefined
    }

    async download_rds_cert(): Promise<void> {
        try {
            await exists('rds-combined-ca-bundle.pem');
            return;
        } catch {
            const writer = fs.createWriteStream('rds-combined-ca-bundle.pem');
            const response = await axios({
                url: 'https://s3.amazonaws.com/rds-downloads/rds-combined-ca-bundle.pem',
                method: 'GET',
                responseType: 'stream'
            })
            response.data.pipe(writer);
            return new Promise((resolve, reject) => {
                writer.on('finish', resolve);
                writer.on('error', reject);
            });   
        }
    }

    async connect(master: boolean): Promise<void> {
        const parsedUrl = url.parse(this.url, true);
        if (parsedUrl.query && parsedUrl.query.ssl_ca_certs === 'rds-combined-ca-bundle.pem') {
            await this.download_rds_cert();
        }
        await this.client.connect();
        this.db = this.client.db(this.dbName);
        if (master) {
            try {
                await this.db.executeDbAdminCommand({ replSetGetStatus: 1 })
            } catch (e) {
                // TODO: Find a sync version of this function
                await this.db.executeDbAdminCommand({ replSetInitiate: {} })
                await timeout(4000)
            }
        } else {
            try {
                // TODO: Find a sync version of this function
                await timeout(8000)
                await this.db.executeDbAdminCommand({ replSetGetStatus: 1 })
            } catch (e) {

            }
        }

    }

    async close(): Promise<void> {
        return this.client.close(true);
    }

    async get_spec_db(logger: Logger): Promise<Spec_DB_Mongo> {
        if (this.specDb !== undefined)
            return this.specDb;
        if (this.db === undefined)
            throw new Error("Not connected");
        this.specDb = new Spec_DB_Mongo(logger, this.db);
        await this.specDb.init();
        return this.specDb;
    }

    async get_provider_db(logger: Logger): Promise<Provider_DB_Mongo> {
        if (this.providerDb !== undefined)
            return this.providerDb;
        if (this.db === undefined)
            throw new Error("Not connected");
        this.providerDb = new Provider_DB_Mongo(logger, this.db);
        await this.providerDb.init();
        return this.providerDb;
    }

    async get_status_db(logger: Logger): Promise<Status_DB_Mongo> {
        if (this.statusDb !== undefined)
            return this.statusDb;
        if (this.db === undefined)
            throw new Error("Not connected");
        this.statusDb = new Status_DB_Mongo(logger, this.db);
        await this.statusDb.init();
        return this.statusDb;
    }

    async get_s2skey_db(logger: Logger): Promise<S2S_Key_DB_Mongo> {
        if (this.s2skeyDb !== undefined)
            return this.s2skeyDb;
        if (this.db === undefined)
            throw new Error("Not connected");
        this.s2skeyDb = new S2S_Key_DB_Mongo(logger, this.db);
        await this.s2skeyDb.init();
        return this.s2skeyDb;
    }

    async get_session_key_db(logger: Logger): Promise<SessionKeyDbMongo> {
        if (this.sessionKeyDb !== undefined)
            return this.sessionKeyDb;
        if (this.db === undefined)
            throw new Error("Not connected");
        this.sessionKeyDb = new SessionKeyDbMongo(logger, this.db);
        await this.sessionKeyDb.init();
        return this.sessionKeyDb;
    }

    async get_intentful_task_db(logger: Logger): Promise<IntentfulTask_DB_Mongo> {
        if (this.intentfulTaskDb !== undefined)
            return this.intentfulTaskDb;
        if (this.db === undefined)
            throw new Error("Not connected");
        this.intentfulTaskDb = new IntentfulTask_DB_Mongo(logger, this.db);
        await this.intentfulTaskDb.init();
        return this.intentfulTaskDb;
    }

    async get_watchlist_db(logger: Logger): Promise<Watchlist_Db_Mongo> {
        if (this.watchlistDb !== undefined)
            return this.watchlistDb;
        if (this.db === undefined)
            throw new Error("Not connected");
        this.watchlistDb = new Watchlist_Db_Mongo(logger, this.db);
        await this.watchlistDb.init();
        return this.watchlistDb;
    }
}