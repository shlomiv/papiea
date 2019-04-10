import * as asyncHandler from 'express-async-handler'
import * as express from "express";
import { Entity_API } from "./entity_api_interface";
import { Router } from "express";
import { Kind } from "../papiea";


export function createEntityRoutes(entity_api: Entity_API): Router {
    const router = express.Router();

    const kind_middleware = asyncHandler(async (req, res, next) => {
        if (req.params.entity_kind === undefined) {
            req.params.entity_kind = await entity_api.get_kind(req.params.prefix, req.params.kind);
            next();
        } else {
            throw new Error("Entity kind already exists in the request");
        }
    });

    const filterEntities = async function (kind: Kind, filter: any): Promise<any> {
        const resultSpecs: any[] = await entity_api.filter_entity_spec(kind, filter);
        
        const resultStatuses: any[] = await entity_api.filter_entity_status(kind, filter);
        
        const uuidToEntity: { [key: string]: any } = {};

        resultSpecs.forEach(x => {
            uuidToEntity[x[0].uuid] = { metadata: x[0], spec: x[1] };
        });

        resultStatuses.forEach(x => {
            if (uuidToEntity[x[0].uuid] !== undefined)
                uuidToEntity[x[0].uuid].status = x[1];
        });

        return Object.values(uuidToEntity);
    };

    router.get("/:prefix/:kind", kind_middleware, asyncHandler(async (req, res) => {
        const filter: any = {};
        if (req.query.spec) {
            filter.spec = JSON.parse(req.query.spec);
        } else {
            filter.spec = {};
        }
        if (req.query.status) {
            filter.status = JSON.parse(req.query.status);
        } else {
            filter.status = {};
        }
        if (req.query.metadata) {
            filter.metadata = JSON.parse(req.query.metadata);
        } else {
            filter.metadata = {};
        }
        res.json(await filterEntities(req.params.entity_kind, filter));
    }));

    router.get("/:prefix/:kind/:uuid", kind_middleware, asyncHandler(async (req, res) => {
        const [metadata, spec] = await entity_api.get_entity_spec(req.params.entity_kind, req.params.uuid);
        const [_, status] = await entity_api.get_entity_status(req.params.entity_kind, req.params.uuid);
        res.json({ "metadata": metadata, "spec": spec, "status": status });
    }));

    router.post("/:prefix/:kind/filter", kind_middleware, asyncHandler(async (req, res) => {
        const filter: any = {};
        if (req.body.spec) {
            filter.spec = req.body.spec;
        } else {
            filter.spec = {};
        }
        if (req.body.status) {
            filter.status = req.body.status;
        } else {
            filter.status = {};
        }
        if (req.body.metadata) {
            filter.metadata = req.body.metadata;
        } else {
            filter.metadata = {};
        }

        res.json(await filterEntities(req.params.entity_kind, filter));
    }));

    router.put("/:prefix/:kind/:uuid", kind_middleware, asyncHandler(async (req, res) => {
        const request_metadata = req.body.metadata;
        const [metadata, spec] = await entity_api.update_entity_spec(req.params.uuid, request_metadata.spec_version, req.params.entity_kind, req.body.spec);
        res.json({ "metadata": metadata, "spec": spec });
    }));

    router.post("/:prefix/:kind", kind_middleware, asyncHandler(async (req, res) => {
        if (req.params.status) {
            const [metadata, spec] = await entity_api.save_entity(req.params.entity_kind, req.body.spec, req.body.metadata);
            res.json({ "metadata": metadata, "spec": spec });
        } else {
            // Spec only entity
            const [metadata, spec] = await entity_api.save_entity(req.params.entity_kind, req.body.spec, req.body.metadata);
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

    router.post("/:prefix/procedure/:procedure_name", asyncHandler(async (req, res) => {
        const result: any = await entity_api.call_provider_procedure(req.params.prefix, req.params.procedure_name, req.body.input);
        res.json(result);
    }));

    return router;
}
