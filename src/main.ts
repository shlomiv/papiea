import * as express from "express";
import createProviderAPIRouter from "./provider/provider_routes";
import { Provider_API_Impl } from "./provider/provider_api_impl";
import { MongoConnection } from "./databases/mongo";
const swaggerUi = require('express-swaggerize-ui');

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
    app.use('/api-docs.json', function (req, res) {
        // TODO(adolgarev): generate swagger on the fly
        // res.json(...);
    });
    app.use('/api-docs', swaggerUi({ route: '/api-docs', docs: 'https://petstore.swagger.io/v2/swagger.json' }));
    const mongoConnection: MongoConnection = new MongoConnection(process.env.MONGO_URL || 'mongodb://mongo:27017', process.env.MONGO_DB || 'papiea');
    await mongoConnection.connect();
    const providerDb = await mongoConnection.get_provider_db();
    const statusDb = await mongoConnection.get_status_db();
    app.use('/provider', createProviderAPIRouter(new Provider_API_Impl(providerDb, statusDb)));
    app.use(function (err: any, req: any, res: any, next: any) {
        if (res.headersSent) {
            return next(err);
        }
        res.status(500);
        console.error(err);
        res.json({ error: `${err}` });
    });
    return app;
}

setUpApplication().then(app => {
    app.listen(serverPort, function () {
        console.log(`Papiea app listening on port ${serverPort}!`);
    });
}).catch(console.error);
