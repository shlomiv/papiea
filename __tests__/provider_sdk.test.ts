import "jest"
import {load} from "js-yaml";
import {readFileSync} from "fs";
import {resolve} from "path";


describe("Provider Sdk tests", () => {
    const sample_yaml = load(readFileSync(resolve(__dirname, "./sample_test_data.yml"), "utf-8"));
    test("Yaml parses into walkable tree", () => {
        expect(sample_yaml).not.toBeNull();
        expect(sample_yaml.Location).not.toBeNull();
    });
    test("Yaml openapi spec-only model example contains valid structure", () => {
        expect(sample_yaml.Location["x-papiea-entity"]).not.toBeUndefined();
        expect(sample_yaml.Location["x-papiea-entity"]).toBe("spec-only");
        expect(sample_yaml.Location["properties"]).not.toBeUndefined();
        const props = sample_yaml.Location["properties"];
        for (let prop in props) {
            if (props.hasOwnProperty(prop)) {
                expect(props[prop]["type"]).not.toBeUndefined();
            }
        }
    })
});