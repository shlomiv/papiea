import * as express from "express";
import { Provider_API, Provider_Power } from "./provider_api_interface";
import * as asyncHandler from 'express-async-handler'
import { Kind, Provider } from "../papiea";

export default function createProviderAPIRouter(providerApi: Provider_API) {
    const providerApiRouter = express.Router();

    const provider_validate_status_middleware = asyncHandler(async (req, res, next) => {
        const provider: Provider = await providerApi.get_provider_by_kind(req.body.entity_ref.kind);
        const kind = provider.kinds.find(kind => kind.name === req.body.entity_ref.kind);
        if (kind === undefined) {
            throw new Error("Kind not found");
        }
        providerApi.validate_status(req.body.status, kind.kind_structure);
        next();
    });

    providerApiRouter.post('/', asyncHandler(async (req, res) => {
        const result = await providerApi.register_provider(req.body);
        res.json(result);
    }));

    providerApiRouter.delete('/:prefix/:version', asyncHandler(async (req, res) => {
        await providerApi.unregister_provider(req.params.prefix, req.params.version);
        res.json("OK")
    }));

    providerApiRouter.post('/update_status', provider_validate_status_middleware, asyncHandler(async (req, res) => {
        await providerApi.update_status(req.body.context, req.body.entity_ref, req.body.status);
        res.json("OK")
    }));

    providerApiRouter.post('/update_progress', asyncHandler(async (req, res) => {
        await providerApi.update_progress(req.body.context, req.body.message, req.body.done_percent);
        res.json("OK");
    }));

    providerApiRouter.post('/:prefix/:version/power', asyncHandler(async (req, res) => {
        const power: Provider_Power = Provider_Power[req.body.power as keyof typeof Provider_Power];
        await providerApi.power(req.params.prefix, req.params.version, power);
        res.json("OK")
    }));

    return providerApiRouter;
}
