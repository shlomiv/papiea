import * as express from "express";
import createAPIDocsRouter from "./api_docs/api_docs_routes";
import ApiDocsGenerator from "./api_docs/api_docs_generator";
import createProviderAPIRouter from "./provider/provider_routes";
import { Provider_API_Impl } from "./provider/provider_api_impl";
import { Provider_API } from "./provider/provider_api_interface";
import { MongoConnection } from "./databases/mongo";
import { createEntityAPIRouter } from "./entity/entity_routes";
import { Entity_API_Impl, ProcedureInvocationError } from "./entity/entity_api_impl";
import { ValidationError, Validator } from "./validator";
import { EntityNotFoundError } from "./databases/utils/errors";
import { test_authn } from "./auth/authn";
import { Authorizer, NoAuthAuthorizer, PerProviderAuthorizer, TestAuthorizer, PermissionDeniedError } from "./auth/authz";
import { ProviderCasbinAuthorizerFactory } from "./auth/casbin";
import { resolve } from "path";

declare var process: {
    env: {
        SERVER_PORT: string,
        MONGO_URL: string,
        MONGO_DB: string,
        AUTHORIZER: string
    },
    title: string;
};
process.title = 'papiea';
const serverPort = parseInt(process.env.SERVER_PORT || '3000');

async function getEntityApiAuthorizer(providerApi: Provider_API): Promise<Authorizer> {
    const pathToDefaultModel: string = resolve(__dirname, './auth/default_provider_model.txt');
    if (process.env.AUTHORIZER === 'CasbinAuthorizer') {
        return new PerProviderAuthorizer(providerApi, new ProviderCasbinAuthorizerFactory(pathToDefaultModel));
    } else if (process.env.AUTHORIZER === 'CasbinTestAuthorizer') {
        const authorizerToBeTested = new PerProviderAuthorizer(providerApi, new ProviderCasbinAuthorizerFactory(pathToDefaultModel));
        const authorizer = new TestAuthorizer(authorizerToBeTested);
        return authorizer;
    } else {
        return new NoAuthAuthorizer();
    }
}

async function setUpApplication(): Promise<express.Express> {
    const app = express();
    app.use(express.json());
    app.use(test_authn);
    const mongoConnection: MongoConnection = new MongoConnection(process.env.MONGO_URL || 'mongodb://mongo:27017', process.env.MONGO_DB || 'papiea');
    await mongoConnection.connect();
    const providerDb = await mongoConnection.get_provider_db();
    const specDb = await mongoConnection.get_spec_db();
    const statusDb = await mongoConnection.get_status_db();
    const validator = new Validator();
    const providerApi = new Provider_API_Impl(providerDb, statusDb, validator, new NoAuthAuthorizer());
    const entityApiAuthorizer: Authorizer = await getEntityApiAuthorizer(providerApi);
    app.use('/provider', createProviderAPIRouter(providerApi));
    app.use('/entity', createEntityAPIRouter(new Entity_API_Impl(statusDb, specDb, providerApi, validator, entityApiAuthorizer)));
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
                res.json({ error: `Entity with kind: ${err.kind}, uuid: ${err.uuid} not found` });
                return;
            case PermissionDeniedError:
                res.status(403);
                res.json({ error: 'Forbidden' });
                return;
            default:
                res.status(500);
                console.error(err);
                res.json({ error: `${err}` });
        }
    });
    return app;
}

setUpApplication().then(app => {
    app.listen(serverPort, function () {
        console.log(`Papiea app listening on port ${serverPort}!`);
    });
}).catch(console.error);
