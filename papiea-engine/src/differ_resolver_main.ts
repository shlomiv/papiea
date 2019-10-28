import { WinstonLogger } from "./logger"
import { MongoConnection } from "./databases/mongo"
import * as redis from "redis"

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
        REDIS_URL: string
    },
    title: string;
};

const mongoUrl = process.env.MONGO_URL || 'mongodb://mongo:27017';
const mongoDb = process.env.MONGO_DB || 'papiea';
const adminKey = process.env.PAPIEA_ADMIN_S2S_KEY || '';
const loggingLevel = process.env.LOGGING_LEVEL || 'info';
const redisUrl = process.env.REDIS_URL || ''

async function setUpTaskManager() {
    const logger = new WinstonLogger(loggingLevel);
    const mongoConnection: MongoConnection = new MongoConnection(mongoUrl, mongoDb);
    await mongoConnection.connect();

    const providerDb = await mongoConnection.get_provider_db(logger);
    const specDb = await mongoConnection.get_spec_db(logger);
    const statusDb = await mongoConnection.get_status_db(logger);
    const intentfulTaskDb = await mongoConnection.get_intentful_task_db(logger)

    const redisClient = redis.createClient(redisUrl)
}