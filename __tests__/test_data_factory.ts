import { load } from "js-yaml";
import { readFileSync } from "fs";
import { resolve } from "path";
import { plural } from "pluralize";
import { Procedural_Execution_Strategy, Procedural_Signature, Provider, SpecOnlyEntityKind } from "../src/papiea";
import { Data_Description, Provider_Callback_URL } from "../src/core";

function randomString(len: number) {
    var charSet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    var randomString = '';
    for (var i = 0; i < len; i++) {
        var randomPoz = Math.floor(Math.random() * charSet.length);
        randomString += charSet.substring(randomPoz, randomPoz + 1);
    }
    return randomString;
}

export function loadYaml(relativePath: string): any {
    return load(readFileSync(resolve(__dirname, relativePath), "utf-8"));
}

export function loadJson(relativePath: string): any {
    return JSON.parse(readFileSync(resolve(__dirname, relativePath), 'utf8'));
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
        intentful_signatures: new Map(),
        dependency_tree: new Map(),
        procedures: {},
        differ: undefined,
    };
    return spec_only_kind;
}

export enum ProviderTypes {
    ENITIES_ONLY,
    KIND_LEVEL_PROCEDURES,
    PROVIDER_LEVEL_KIND_LEVEL_PROCEDURES,
    PROVIDER_LEVEL_PROCEDURES
}

export class ProviderFactory {
    public static get_provider(provider_type: ProviderTypes, procedure_callback: Provider_Callback_URL) {
        let provider = {} as Provider;
        switch (provider_type) {
            case ProviderTypes.ENITIES_ONLY:
                return getProviderWithSpecOnlyEnitityKindNoOperations();
            case ProviderTypes.KIND_LEVEL_PROCEDURES:
                provider = getProviderWithSpecOnlyEnitityKindNoOperations();
                return getProviderWithSpecOnlyEnitityKindWithOperations(provider, procedure_callback);
            case ProviderTypes.PROVIDER_LEVEL_PROCEDURES:
                return getProviderWithProcedures(procedure_callback);
            case ProviderTypes.PROVIDER_LEVEL_KIND_LEVEL_PROCEDURES:
                provider = getProviderWithProcedures(procedure_callback);
                return getProviderWithSpecOnlyEnitityKindWithOperations(provider, procedure_callback);
            default:
                throw new Error("Selected provider type is non existent")
        }
    }
}
export function getProviderWithSpecOnlyEnitityKindNoOperations(): Provider {
    const spec_only_kind = getSpecOnlyEntityKind();
    const providerPrefix = randomString(12);
    const providerVersion = "0.1.0";
    return { prefix: providerPrefix, version: providerVersion, kinds: [spec_only_kind] };
}

export function getProviderWithSpecOnlyEnitityKindWithOperations(provider: Provider, procedure_callback: Provider_Callback_URL): Provider {
    const proceduralSignature: Procedural_Signature = {
        name: "moveX",
        argument: loadYaml("./procedure_move_input.yml"),
        result: loadYaml("./location_kind_test_data.yml"),
        execution_strategy: Procedural_Execution_Strategy.Halt_Intentful,
        procedure_callback: procedure_callback
    };
    provider.kinds[0].procedures[proceduralSignature.name] = proceduralSignature;
    return provider;
}

export function getProviderWithProcedures(procedure_callback: Provider_Callback_URL): Provider {
    const spec_only_kind = getSpecOnlyEntityKind();
    const providerPrefix = randomString(12);
    const providerVersion = "0.1.0";
    const provider: Provider = { prefix: providerPrefix, version: providerVersion, kinds: [spec_only_kind], procedures: {} };
    const proceduralSignature: Procedural_Signature = {
        name: "computeSum",
        argument: loadYaml("./procedure_sum_input.yml"),
        result: loadYaml("./procedure_sum_output.yml"),
        execution_strategy: Procedural_Execution_Strategy.Halt_Intentful,
        procedure_callback: procedure_callback
    };
    if (provider.procedures === undefined) {
        throw new Error("Something went wrong in provider creation. Procedure property is undefined");
    }
    provider.procedures[proceduralSignature.name] = proceduralSignature;
    return provider;
}