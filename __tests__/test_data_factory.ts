import { load } from "js-yaml";
import { readFileSync } from "fs";
import { resolve } from "path";
import { plural } from "pluralize";
import { Provider, SpecOnlyEntityKind } from "../src/papiea";
import { Entity, Data_Description } from "../src/core";

function randomString(len: number) {
    var charSet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    var randomString = '';
    for (var i = 0; i < len; i++) {
        var randomPoz = Math.floor(Math.random() * charSet.length);
        randomString += charSet.substring(randomPoz, randomPoz + 1);
    }
    return randomString;
}

function loadYaml(relativePath: string): any {
    return load(readFileSync(resolve(__dirname, relativePath), "utf-8"));
}

export function getLocationDataDescription(): Data_Description {
    return loadYaml("./location_kind_test_data.yml");
}

export function getSpecOnlyEntityKind(): SpecOnlyEntityKind {
    const locationDataDescription = getLocationDataDescription();
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
    return spec_only_kind;
}

export function getProviderWithSpecOnlyEnitityKindNoOperations(): Provider {
    const spec_only_kind = getSpecOnlyEntityKind();
    const providerPrefix = randomString(12);
    const providerVersion = "0.1.0";
    const provider: Provider = { prefix: providerPrefix, version: providerVersion, kinds: [spec_only_kind] };
    return provider;
}
