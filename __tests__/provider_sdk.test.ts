import "jest"
import {load} from "js-yaml";
import {readFileSync} from "fs";
import {resolve} from "path";


describe("Provider Sdk tests", () => {
    test("Yaml parses into walkable tree", () => {
        const sample_yaml = load(readFileSync(resolve(__dirname, "./sample_test_data.yml"), "utf-8"));
        expect(sample_yaml.Location).not.toBeNull();
    })
});