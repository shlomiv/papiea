import * as express from "express";
import { Provider_DB } from "./databases/provider_db_interface";
const swaggerUi = require("express-swaggerize-ui");

class ApiDocGenerator {
    providerDb: Provider_DB;

    constructor(providerDb: Provider_DB) {
        this.providerDb = providerDb;
    }

    async getApiDoc(): Promise<any> {
        const root:any = {
            "openapi": "3.0.0",
            "info": {
                "version": "1.0.0",
                "title": "Swagger Papiea",
                "description": "An API specification of Papiea-JS",
                "license": {
                    "name": "LICENSE",
                    "url": "https://github.com/nutanix/papiea-js/blob/master/LICENSE"
                }
            },
            "servers": [
                {
                    "url": "/"
                }
            ],
            "paths": {},
            "components": {
                "schemas": {
                    "Error": {
                        "required": [
                            "code",
                            "message"
                        ],
                        "properties": {
                            "code": {
                                "type": "integer",
                                "format": "int32"
                            },
                            "message": {
                                "type": "string"
                            }
                        }
                    }
                }
            }
        };

        const paths = root.paths;
        const schemas = root.components.schemas;
        const providers = await this.providerDb.list_providers();
        providers.forEach(provider => {
            provider.kinds.forEach(kind => {
                const kindEndpoints:any = {};
                paths[`/probider/${provider.prefix}/${kind.name}`] = kindEndpoints;
                kindEndpoints["get"] = {
                    "description": `Returns all entities' specs of kind ${kind.name}`,
                    "operationId": `find${kind.name}`,
                    "parameters": [
                        {
                            "name": "offset",
                            "in": "query",
                            "description": "offset of results to return",
                            "required": false,
                            "schema": {
                                "type": "integer",
                                "format": "int32"
                            }
                        },
                        {
                            "name": "limit",
                            "in": "query",
                            "description": "maximum number of results to return",
                            "required": false,
                            "schema": {
                                "type": "integer",
                                "format": "int32"
                            }
                        }
                    ],
                    "responses": {
                        "200": {
                            "description": `${kind.name} response`,
                            "content": {
                                "application/json": {
                                    "schema": {
                                        "type": "array",
                                        "items": {
                                            "$ref": `#/components/schemas/${kind.name}`
                                        }
                                    }
                                }
                            }
                        },
                        "default": {
                            "description": "unexpected error",
                            "content": {
                                "application/json": {
                                    "schema": {
                                        "$ref": "#/components/schemas/Error"
                                    }
                                }
                            }
                        }
                    }
                };
                Object.assign(schemas, kind.kind_structure);
            });
        });

        return root;
    }
}

export default function createAPIDocsRouter(urlPrefix: string, providerDb: Provider_DB) {
    const apiDocsRouter = express.Router();
    const apiDocGenerator = new ApiDocGenerator(providerDb);

    apiDocsRouter.get('/api-docs.json', function (req, res, next) {
        apiDocGenerator.getApiDoc().then(result => {
            res.json(result);
        }).catch(next);
    });
    apiDocsRouter.use('/', swaggerUi({ route: urlPrefix, docs: urlPrefix + '/api-docs.json' }));

    return apiDocsRouter;
}