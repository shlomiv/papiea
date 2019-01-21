import * as asyncHandler from 'express-async-handler'
import * as express from "express";
import { EntityAPI } from "./entity_api_impl";
import { Router } from "express";
import { Kind } from "../papiea";


export function createEntityRoutes(entity_api: EntityAPI): Router {
    const router = express.Router();

    const kind_middleware = asyncHandler(async (req, res, next) => {
        if (req.params.entity_kind === undefined) {
            req.params.entity_kind = await entity_api.get_kind(req.params.prefix, req.params.kind);
            next();
        } else {
            throw new Error("Entity kind already exists in the request");
        }
    });

    const validate_kind_middleware = asyncHandler(async (req, res, next) => {
        const kind: Kind = req.params.entity_kind;
        entity_api.validate_spec(req.body.spec, kind.kind_structure);
        next();
    });


    router.get("/:prefix/:kind", kind_middleware, asyncHandler(async (req, res) => {
        const filter: any = {};
        if (req.query.spec) {
            filter.spec = JSON.parse(req.query.spec);
        }
        let result: any[] = await entity_api.filter_entity_spec(req.params.entity_kind, filter);
        result = result.map(x => {
            return { "metadata": x[0], "spec": x[1] }
        });
        res.json(result);
    }));

    router.get("/:prefix/:kind/:uuid", kind_middleware, asyncHandler(async (req, res) => {
        const [metadata, spec] = await entity_api.get_entity_spec(req.params.entity_kind, req.params.uuid);
        res.json({ "metadata": metadata, "spec": spec });
    }));

    router.post("/:prefix/:kind/filter", kind_middleware, asyncHandler(async (req, res) => {
        const filter: any = {};
        if (req.body.spec) {
            filter.spec = req.body.spec;
        }
        let result: any[] = await entity_api.filter_entity_spec(req.params.entity_kind, filter);
        result = result.map(x => {
            return { "metadata": x[0], "spec": x[1] }
        });
        res.json(result);
    }));

    router.put("/:prefix/:kind/:uuid", kind_middleware, validate_kind_middleware, asyncHandler(async (req, res) => {
        const request_metadata = req.body.metadata;
        const [metadata, spec] = await entity_api.update_entity_spec(req.params.uuid, request_metadata.spec_version, req.params.entity_kind, req.body.spec);
        res.json({ "metadata": metadata, "spec": spec });
    }));

    router.post("/:prefix/:kind", kind_middleware, validate_kind_middleware, asyncHandler(async (req, res) => {
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

    router.post("/:prefix/:kind/:uuid/procedure/:procedure_name", kind_middleware, asyncHandler(async (req, res) => {
        const result: any = await entity_api.call_procedure(req.params.entity_kind, req.params.uuid, req.params.procedure_name, req.body.input);
        res.json(result);
    }));

    return router;
}