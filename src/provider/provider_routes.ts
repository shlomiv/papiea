import * as express from "express";
import { Provider_API, Provider_Power } from "./provider_api_interface";

export default function createProviderAPIRouter(providerApi: Provider_API) {
    const providerApiRouter = express.Router();

    providerApiRouter.post('/', (req, res, next) => {
        providerApi.register_provider(req.body).then(result => {
            res.json(result);
        }).catch(next);
    });

    providerApiRouter.delete('/:prefix/:version', (req, res, next) => {
        providerApi.unregister_provider(req.params.prefix, req.params.version).then(result => {
            res.json("OK");
        }).catch(next);
    });

    providerApiRouter.post('/update_status', (req, res, next) => {
        providerApi.update_status(req.body.context, req.body.entity_ref, req.body.status).then(result => {
            res.json("OK");
        }).catch(next);
    });

    providerApiRouter.post('/update_progress', (req, res, next) => {
        providerApi.update_progress(req.body.context, req.body.message, req.body.done_percent).then(result => {
            res.json("OK");
        }).catch(next);
    });

    providerApiRouter.post('/:prefix/:version/power', (req, res, next) => {
        const power: Provider_Power = Provider_Power[req.body.power as keyof typeof Provider_Power];
        providerApi.power(req.params.prefix, req.params.version, power).then(result => {
            res.json("OK");
        }).catch(next);
    });

    return providerApiRouter;
}
