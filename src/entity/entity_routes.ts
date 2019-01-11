import * as asyncHandler from 'express-async-handler'
import * as express from "express";
import { EntityAPI } from "./entity_api_impl";
import { Router } from "express";


export function createEntityRoutes(entity_api: EntityAPI): Router {
    const router = express.Router();

    const kind_middleware = asyncHandler(async (req, res, next) => {
        if (req.params.entity_kind === undefined) {
            req.params.entity_kind = await entity_api.get_kind(req.params.prefix, req.params.kind);
            next();
        } else {
            throw new Error("Entity kind is already existing the request");
        }
    });


    router.get("/:prefix/:kind", kind_middleware, asyncHandler(async (req, res) => {
        const spec_params = JSON.parse(req.query.spec);
        const spec = { spec: spec_params };
        const result = await entity_api.filter_entity_spec(req.params.entity_kind, spec);
        res.json({ "result": result });
    }));

    router.get("/:prefix/:kind/:uuid", kind_middleware, asyncHandler(async (req, res) => {
        const [metadata, spec] = await entity_api.get_entity_spec(req.params.entity_kind, req.params.uuid);
        res.json({ "metadata": metadata, "spec": spec });
    }));

    router.post("/:prefix/:kind/filter", kind_middleware, asyncHandler(async (req, res) => {
        const result = await entity_api.filter_entity_spec(req.params.entity_kind, req.body.filter_fields);
        res.json({ "result": result });
    }));

    router.put("/:prefix/:kind/:uuid", kind_middleware, asyncHandler(async (req, res) => {
        const request_metadata = req.body.metadata;
        const [metadata, spec] = await entity_api.update_entity_spec(req.params.uuid, request_metadata.spec_version, req.params.entity_kind, req.body.spec);
        res.json({ "metadata": metadata, "spec": spec });
    }));

    router.post("/:prefix/:kind", kind_middleware, asyncHandler(async (req, res) => {
        if (req.params.status) {
            const [metadata, spec] = await entity_api.save_entity(req.params.entity_kind, req.body.spec);
            res.json({ "metadata": metadata, "spec": spec });
        } else {
            // Spec only entity
            const [metadata, spec] = await entity_api.save_entity(req.params.entity_kind, req.body.spec);
            res.json({ "metadata": metadata, "spec": spec });
        }
    }));

    router.delete("/:prefix/:kind/:uuid", kind_middleware, asyncHandler(async (req, res) => {
        await entity_api.delete_entity_spec(req.params.entity_kind, req.params.uuid);
        res.json("OK")
    }));

    return router;
}