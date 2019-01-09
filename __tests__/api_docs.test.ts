import "jest"
import { load } from "js-yaml";
import { readFileSync, writeFileSync, unlinkSync } from "fs";
import { resolve } from "path";
import { plural } from "pluralize";
import { validate } from "swagger-parser";
import axios from "axios"
import { Version, Entity } from "../src/core";
import { Provider, SpecOnlyEntityKind } from "../src/papiea";
import { Provider_DB } from "../src/databases/provider_db_interface";
import ApiDocsGenerator from "../src/api_docs/api_docs_generator";

declare var process: {
    env: {
        SERVER_PORT: string
    }
};
const serverPort = parseInt(process.env.SERVER_PORT || '3000');

const api = axios.create({
    baseURL: `http://127.0.0.1:${serverPort}/`,
    timeout: 1000,
    headers: { 'Content-Type': 'application/json' }
});

class Provider_DB_Mock implements Provider_DB {
    provider: Provider;

    constructor() {
        const locationDataDescription = load(readFileSync(resolve(__dirname, "./location_kind_test_data.yml"), "utf-8"));
        const name = Object.keys(locationDataDescription)[0];
        const spec_only_kind: SpecOnlyEntityKind = {
            name,
            name_plural: plural(name),
            kind_structure: locationDataDescription,
            validator_fn: {} as (entity: Entity) => boolean,
            intentful_signatures: new Map(),
            dependency_tree: new Map(),
            procedures: new Map(),
            differ: undefined,
            semantic_validator_fn: undefined
        };
        const providerPrefix = "test_provider";
        const providerVersion = "0.1.0";
        const provider: Provider = { prefix: providerPrefix, version: providerVersion, kinds: [spec_only_kind] };
        this.provider = provider;
    }

    async register_provider(provider: Provider): Promise<void> {

    }

    async get_provider(provider_prefix: string, version?: Version): Promise<Provider> {
        return this.provider;
    }

    async list_providers(): Promise<Provider[]> {
        return [this.provider];
    }

    async delete_provider(provider_prefix: string, version: Version): Promise<void> {

    }
}

describe("API Docs Tests", () => {
    const apiDocsGenerator = new ApiDocsGenerator(new Provider_DB_Mock());
    test("Validate API Docs agains OpenAPI spec", async (done) => {
        try {
            const apiDoc = await apiDocsGenerator.getApiDocs();
            const apiDocJson = JSON.stringify(apiDoc);
            writeFileSync("api-docs.json", apiDocJson);
            const api = await validate("api-docs.json");
            expect(api.info.title).toEqual("Swagger Papiea");
            done();
        } catch (err) {
            done.fail(err);
        } finally {
            unlinkSync("api-docs.json");
        }
    });
    test("API Docs should contain paths for CRUD", async (done) => {
        try {
            const apiDoc = await apiDocsGenerator.getApiDocs();
            expect(Object.keys(apiDoc.paths)).toContain("/provider/test_provider/Location");
            const kindPath = apiDoc.paths["/provider/test_provider/Location"];
            expect(Object.keys(kindPath)).toContain("get");
            expect(Object.keys(kindPath)).toContain("post");
            expect(Object.keys(apiDoc.paths)).toContain("/provider/test_provider/Location/{uuid}");
            const kindEntityPath = apiDoc.paths["/provider/test_provider/Location/{uuid}"];
            expect(Object.keys(kindEntityPath)).toContain("get");
            expect(Object.keys(kindEntityPath)).toContain("delete");
            const kindEntityVersionPath = apiDoc.paths["/provider/test_provider/Location/{uuid}/{spec_version}"];
            expect(Object.keys(kindEntityVersionPath)).toContain("put");
            //expect(Object.keys(kindEntityVersionPath)).toContain("patch");
            done();
        } catch (err) {
            done.fail(err);
        }
    });
    test("API Docs should contain Location scheme", async (done) => {
        try {
            const apiDoc = await apiDocsGenerator.getApiDocs();
            expect(Object.keys(apiDoc.components.schemas)).toContain("Location");
            const entitySchema = apiDoc.components.schemas["Location"];
            expect(entitySchema).toEqual({
                "type": "object",
                "title": "X\/Y Location",
                "description": "Stores an XY location of something",
                "x-papiea-entity": "spec-only",
                "properties": {
                    "x": {
                        "type": "number"
                    },
                    "y": {
                        "type": "number"
                    }
                }
            });
            done();
        } catch (err) {
            done.fail(err);
        }
    });
    test("API Docs should be accessible by the url", done => {
        api.get("/api-docs/api-docs.json").then(() => done()).catch(done.fail);
    });
})