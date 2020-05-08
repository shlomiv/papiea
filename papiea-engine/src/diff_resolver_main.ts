import { logLevelFromString, Logger, LoggerFactory } from "papiea-backend-utils"
import { MongoConnection } from "./databases/mongo"
import { Watchlist } from "./tasks/watchlist"
import { DiffResolver } from "./tasks/diff_resolver"
import { BasicDiffer } from "./intentful_core/differ_impl";
import { IntentfulContext } from "./intentful_core/intentful_context";
import { TaskResolver } from "./tasks/task_resolver";
import { IntentfulListenerMongoStream } from "./tasks/intentful_listener_mongo_stream";
import { IntentfulListenerMongo } from "./tasks/intentful_listener_mongo_simple";

declare var process: {
    env: {
        SERVER_PORT: string,
        MONGO_DB: string,
        MONGO_URL: string,
        PAPIEA_PUBLIC_URL: string,
        DEBUG_LEVEL: string,
        PAPIEA_ADMIN_S2S_KEY: string,
        LOGGING_LEVEL: string
        PAPIEA_DEBUG: string,
        DELETED_TASK_PERSIST_SECONDS: number,
        RANDOM_ENTITY_BATCH_SIZE: number,
    },
    title: string;
};

const mongoUrl = process.env.MONGO_URL || 'mongodb://mongo:27017';
const mongoDb = process.env.MONGO_DB || 'papiea';
const loggingLevel = logLevelFromString(process.env.LOGGING_LEVEL) ?? 'debug';
const batchSize = process.env.RANDOM_ENTITY_BATCH_SIZE ?? 5
const deletedTaskPersists = process.env.DELETED_TASK_PERSIST_SECONDS ?? 100

async function setUpDiffResolver() {
    const logger = LoggerFactory.makeLogger({level: loggingLevel});
    const mongoConnection: MongoConnection = new MongoConnection(mongoUrl, mongoDb);
    await mongoConnection.connect();

    const specDb = await mongoConnection.get_spec_db(logger);
    const statusDb = await mongoConnection.get_status_db(logger);
    const providerDb = await mongoConnection.get_provider_db(logger);
    const intentfulTaskDb = await mongoConnection.get_intentful_task_db(logger)
    const watchlistDb = await mongoConnection.get_watchlist_db(logger)

    const differ = new BasicDiffer()
    const intentfulContext = new IntentfulContext(specDb, statusDb, differ, intentfulTaskDb, watchlistDb)
    const watchlist: Watchlist = new Watchlist()

    const intentfulListenerMongo = new IntentfulListenerMongo(statusDb, specDb, watchlist)
    intentfulListenerMongo.run(500)

    const diffResolver = new DiffResolver(watchlist, watchlistDb, specDb, statusDb, providerDb, differ, intentfulContext, logger, batchSize)

    const taskResolver = new TaskResolver(specDb, statusDb, intentfulTaskDb, providerDb, intentfulListenerMongo, differ, diffResolver, watchlist, logger)

    console.log("Running diff resolver")

    taskResolver.run(10000, deletedTaskPersists)
    await diffResolver.run(3000)
}

setUpDiffResolver().then(()=>console.debug("Exiting diff resolver")).catch(console.error)
