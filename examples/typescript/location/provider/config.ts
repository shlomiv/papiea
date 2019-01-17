import { load } from "js-yaml";
import { readFileSync } from "fs";
import { resolve } from "path";

const location_json = load(readFileSync(resolve(__dirname + "/resources", "./location.yml"), "utf-8"));
const input_json = load(readFileSync(resolve(__dirname + "/resources", "./location.yml"), "utf-8"));

export const location_provider_config = {
    provider: {
        prefix: "location_provider",
        version: "0.1.0",
        kind_description: location_json
    },

    procedures: {
        moveX: {
            name: "moveX",
            input_desc: input_json,
            output_desc: location_json,
            callback: "http://127.0.0.1:9000/"
        }
    }
};

export const papiea_config = {
    core: {
        host: "127.0.0.1",
        port: 3000
    }
};