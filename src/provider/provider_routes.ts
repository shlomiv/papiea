import * as express from "express";
import {Provider_API} from "./provider_api_interface";

export default function createProviderAPIRouter(providerApi: Provider_API) {
    const providerApiRouter = express.Router();

    providerApiRouter.post('/', (req, res, next) => {
        providerApi.register_provider(req.body).then(result => {
            res.json(result);
        }).catch(next);
    });

    providerApiRouter.delete('/', (req, res, next) => {
        // providerApi.unregister_provider(...).then(result => {
        //     res.json(result);
        // }).catch(next);
        res.json("OK");
    });

    providerApiRouter.post('/update_status', (req, res, next) => {
        // providerApi.update_status(...).then(result => {
        //     res.json(result);
        // }).catch(next);
        res.json("OK");
    });

    providerApiRouter.post('/update_progress', (req, res, next) => {
        // providerApi.update_progress(...).then(result => {
        //     res.json(result);
        // }).catch(next);
        res.json("OK");
    });

    providerApiRouter.post('/power', (req, res, next) => {
        // providerApi.power(...).then(result => {
        //     res.json(result);
        // }).catch(next);
        res.json("OK");
    });

    return providerApiRouter;
}
