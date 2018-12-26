import "jest"
import {load} from "js-yaml";
import {readFileSync} from "fs";
import {resolve} from "path";
import {ProviderSdk} from "../src/provider_sdk/typescript_sdk";


describe("Provider Sdk tests", () => {
    const location_yaml = load(readFileSync(resolve(__dirname, "./location_kind_test_data.yml"), "utf-8"));
    test("Yaml parses into walkable tree", (done) => {
        expect(location_yaml).not.toBeNull();
        expect(location_yaml.Location).not.toBeNull();
        done();
    });
    test("Yaml openapi spec-only model example contains valid structure", (done) => {
        expect(location_yaml.Location["x-papiea-entity"]).not.toBeUndefined();
        expect(location_yaml.Location["x-papiea-entity"]).toBe("spec-only");
        expect(location_yaml.Location["properties"]).not.toBeUndefined();
        const props = location_yaml.Location["properties"];
        for (let prop in props) {
            if (props.hasOwnProperty(prop)) {
                expect(props[prop]["type"]).not.toBeUndefined();
            }
        }
        done();
    });
    test("Provider can create a new kind", (done) => {
        const sdk = new ProviderSdk();
        const kind = sdk.new_kind(location_yaml);
        expect(kind.name).toBe("Location");
        expect(sdk.kind).not.toBeNull();
        // @ts-ignore
        expect(sdk.kind.name).toBe("Location");
        done();
    });
    test("Provider with no x-papiea-entity should fail", (done) => {
        const sdk = new ProviderSdk();
        const malformed_yaml = Object.assign({}, location_yaml);
        malformed_yaml.Location["x-papiea-entity"] = undefined;
        try {
            sdk.new_kind(malformed_yaml)
        } catch (err) {
            expect(err).not.toBeNull();
            done();
        }
    });
});