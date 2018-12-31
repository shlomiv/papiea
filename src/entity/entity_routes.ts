import * as asyncHandler from 'express-async-handler'
import * as express from "express";
import {EntityAPI} from "./entity_api_impl";


export function createEntityRoutes(entity_api: EntityAPI) {
    const router = express.Router();

    router.use(asyncHandler(async (req, res, next) => {
        if (!req.params.entity_kind) {
            req.params.entity_kind = await entity_api.get_kind(req.params.prefix, req.params.kind);
            next();
        } else {
            throw new Error("Entity kind is already existing the request");
        }
    }));


    router.get("/:prefix/:kind/:uuid", asyncHandler(async (req, res) => {
        const [metadata, spec] = await entity_api.get_entity_spec(req.params.entity_kind, req.params.uuid);
        res.json({"metadata": metadata, "spec": spec});
    }));

    // This could be GET /:prefix/:kind with query params as filter
    router.post("/:prefix/:kind/filter", asyncHandler(async (req, res) => {
        const result = await entity_api.filter_entity_spec(req.params.entity_kind, req.params.filter_fields);
        res.json({"result": result});
    }));

    router.put("/:prefix/:kind/:uuid", asyncHandler(async (req, res) => {
        const [metadata, spec] = await entity_api.update_entity_spec(req.params.entity_kind, req.params.spec);
        res.json({"metadata": metadata, "spec": spec});
    }));

    router.post("/:prefix/:kind", asyncHandler(async (req, res) => {
        if (req.params.status) {
            const [metadata, spec] = await entity_api.save_entity(req.params.entity_kind, req.params.spec, req.params.status);
            res.json({"metadata": metadata, "spec": spec});
        } else {
            // Spec only entity
            const [metadata, spec] = await entity_api.save_entity(req.params.entity_kind, req.params.spec);
            res.json({"metadata": metadata, "spec": spec});
        }
    }));

    return router;
}