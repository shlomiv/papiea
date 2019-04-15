import * as express from "express";
import createAPIDocsRouter from "./api_docs/api_docs_routes";
import ApiDocsGenerator from "./api_docs/api_docs_generator";
import createProviderAPIRouter from "./provider/provider_routes";
import { Provider_API_Impl } from "./provider/provider_api_impl";
import { MongoConnection } from "./databases/mongo";
import { createEntityRoutes } from "./entity/entity_routes";
import { Entity_API_Impl, ProcedureInvocationError } from "./entity/entity_api_impl";
import { ValidationError, Validator } from "./validator";
import { EntityNotFoundError } from "./databases/utils/errors";

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
    const validator = new Validator();
    const providerApi = new Provider_API_Impl(providerDb, statusDb);
    app.use('/provider', createProviderAPIRouter(providerApi));
    app.use('/services', createEntityRoutes(new Entity_API_Impl(statusDb, specDb, providerApi, validator)));
    app.use('/api-docs', createAPIDocsRouter('/api-docs', new ApiDocsGenerator(providerDb)));
    app.use(function (err: any, req: any, res: any, next: any) {
        if (res.headersSent) {
            return next(err);
        }
        switch (err.constructor) {
            case ValidationError:
                res.status(400);
                res.json({ errors: err.errors });
                return;
            case ProcedureInvocationError:
                res.status(err.status);
                res.json({ errors: err.errors });
                return;
            case EntityNotFoundError:
                res.status(404);
                res.json({"error": `Entity with kind: ${err.kind}, uuid: ${err.uuid} not found`});
                return;
            default:
                res.status(500);
                console.error(err);
                res.json({ error: `${ err }` });
        }
    });
    return app;
}

setUpApplication().then(app => {
    app.listen(serverPort, function () {
        console.log(`Papiea app listening on port ${ serverPort }!`);
    });
}).catch(console.error);
