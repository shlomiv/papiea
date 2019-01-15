import { load } from "js-yaml";
import { readFileSync } from "fs";
import { resolve } from "path";

const location_json = load(readFileSync(resolve(__dirname + "/resources", "./location_kind_test_data.yml"), "utf-8"));

export const location_provider_config = {
    provider: {
        prefix: "location_provider",
        version: "0.1.0",
        kind_description: location_json
    }
};

export const papiea_config = {
    core: {
        host: "127.0.0.1",
        port: 3000
    }
};