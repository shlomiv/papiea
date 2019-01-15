import "jest"
import { load } from "js-yaml";
import { readFileSync } from "fs";
import { resolve } from "path";
import { ProviderSdk } from "../src/provider_sdk/typescript_sdk";
// @ts-ignore
import { plural } from "pluralize"
import { Kind } from "../src/papiea";


declare var process: {
    env: {
        SERVER_PORT: string
    }
};

const serverPort = parseInt(process.env.SERVER_PORT || '3000');

const settings = {
    core: {
        host: "127.0.0.1",
        port: serverPort
    }
};

describe("Provider Sdk tests", () => {
    test("Pluralize works for 'test' & 'provider' words used", (done) => {
        expect(plural("test")).toBe("tests");
        expect(plural("provider")).toBe("providers");
        done();
    });
    const localhost = "127.0.0.1";
    const provider_version = "0.1.0";
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
    test("Wrong yaml description causes error", (done) => {
        const sdk = ProviderSdk.create_sdk(settings);
        try {
            sdk.new_kind({});
        } catch (err) {
            expect(err).not.toBeNull();
            done();
        }
    });
    test("Provider can create a new kind", (done) => {
        const sdk = ProviderSdk.create_sdk(settings);
        const kind = sdk.new_kind(location_yaml);
        expect(kind.name).toBe("Location");
        done();
    });
    test("Provider with no x-papiea-entity should fail", (done) => {
        const sdk = ProviderSdk.create_sdk(settings);
        const malformed_yaml = JSON.parse(JSON.stringify(location_yaml));
        malformed_yaml.Location["x-papiea-entity"] = "fail";
        try {
            sdk.new_kind(malformed_yaml);
        } catch (err) {
            expect(err).not.toBeNull();
            done();
        }
    });
    test("Provider without version should fail to register", async (done) => {
        const sdk = ProviderSdk.create_sdk(settings);
        try {
            sdk.new_kind(location_yaml);
            sdk.prefix("test_provider");
            await sdk.register();
        } catch (err) {
            expect(err.message).toBe("Malformed provider description. Missing: version");
            done();
        }
    });
    test("Provider without kind should fail to register", async (done) => {
        const sdk = ProviderSdk.create_sdk(settings);
        try {
            sdk.prefix("test_provider");
            sdk.version(provider_version);
            await sdk.register();
        } catch (err) {
            expect(err.message).toBe("Malformed provider description. Missing: kind");
            done();
        }
    });
    test("Provider without prefix should fail to register", async (done) => {
        const sdk = ProviderSdk.create_sdk(settings);
        try {
            sdk.new_kind(location_yaml);
            sdk.version(provider_version);
            await sdk.register();
        } catch (err) {
            expect(err.message).toBe("Malformed provider description. Missing: prefix");
            done();
        }
    });
    test("Add multiple kinds shouldn't fail", (done) => {
        const sdk = ProviderSdk.create_sdk(settings);
        const geo_location_yaml = JSON.parse(JSON.stringify(location_yaml));
        sdk.new_kind(location_yaml);
        sdk.new_kind(geo_location_yaml);
        done();
    });
    let location_kind: Kind;
    test("Duplicate delete on kind should return false", (done) => {
        const sdk = ProviderSdk.create_sdk(settings);
        location_kind = sdk.new_kind(location_yaml);
        expect(sdk.remove_kind(location_kind)).toBeTruthy();
        expect(sdk.remove_kind(location_kind)).toBeFalsy();
        done();
    });
    test("Duplicate add on kind should return false", (done) => {
        const sdk = ProviderSdk.create_sdk(settings);
        expect(sdk.add_kind(location_kind)).toBeTruthy();
        expect(sdk.add_kind(location_kind)).toBeFalsy();
        done();
    });
    test("Provider should be created on papiea", async (done) => {
        const sdk = ProviderSdk.create_sdk(settings);
        sdk.new_kind(location_yaml);
        sdk.version(provider_version);
        sdk.prefix("location_provider");
        try {
            await sdk.register();
        } catch (e) {
            done.fail(e)
        }
        done();
    });
});