import * as express from "express";
import createProviderAPIRouter from "./provider/provider_routes";
import { Provider_API_Impl } from "./provider/provider_api_impl";
import { MongoConnection } from "./databases/mongo";
import { createEntityRoutes } from "./entity/entity_routes";
import { EntityAPI } from "./entity/entity_api_impl";

declare var process: {
    env: {
        SERVER_PORT: string,
        MONGO_URL: string,
        MONGO_DB: string
    },
    title: string;
};
process.title = 'papiea';
const serverPort = parseInt(process.env.SERVER_PORT || '3000');

async function setUpApplication(): Promise<express.Express> {
    const app = express();
    app.use(express.json());
    const mongoConnection: MongoConnection = new MongoConnection(process.env.MONGO_URL || 'mongodb://mongo:27017', process.env.MONGO_DB || 'papiea');
    await mongoConnection.connect();
    const providerDb = await mongoConnection.get_provider_db();
    const specDb = await mongoConnection.get_spec_db();
    const statusDb = await mongoConnection.get_status_db();
    app.use('/provider', createProviderAPIRouter(new Provider_API_Impl(providerDb, statusDb)));
    app.use('/entity', createEntityRoutes(new EntityAPI(statusDb, specDb, providerDb)));
    app.use(function (err: any, req: any, res: any, next: any) {
        if (res.headersSent) {
            return next(err);
        }
        res.status(500);
        console.error(err);
        res.json({error: `${err}`});
    });
    return app;
}

setUpApplication().then(app => {
    app.listen(serverPort, function () {
        console.log(`Papiea app listening on port ${serverPort}!`);
    });
}).catch(console.error);
