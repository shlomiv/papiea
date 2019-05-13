import { load } from "js-yaml";
import { readFileSync } from "fs";
import { resolve } from "path";
import { plural } from "pluralize";
import { Provider, SpecOnlyEntityKind, Procedural_Signature, Procedural_Execution_Strategy, Kind } from "../src/papiea";
import { Data_Description, Provider_Callback_URL, Version } from "../src/core";

function randomString(len: number) {
    const charSet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let randomString = '';
    for (let i = 0; i < len; i++) {
        let randomPoz = Math.floor(Math.random() * charSet.length);
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
    let locationDataDescription = loadYaml("./location_kind_test_data.yml");
    let randomizedLocationDataDescription: any = {};
    randomizedLocationDataDescription["Location" + randomString(5)] = locationDataDescription["Location"];
    return randomizedLocationDataDescription;
}

export function getMetadataDescription(): Data_Description {
    let MetadataDescription = loadYaml("./metadata_extension.yml");
    return MetadataDescription;
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

function formatErrorMsg(current_field: string, missing_field: string) {
    return `Please specify ${missing_field} before ${current_field}`
}

export class ProviderBuilder {
    private readonly _prefix: string;
    private _version: Version = "0.1.0";
    private _kinds: Kind[] = [];
    private _procedures: { [key: string]: Procedural_Signature; } = {};
    private _oauth2: any;
    private _extension_structure: any;
    private _policy: any;

    constructor(prefix?: string) {
        if (prefix !== undefined) {
            this._prefix = prefix;
        } else {
            this._prefix = randomString(12);
        }
        return this;
    }

    public build(): Provider {
        const provider: Provider = { prefix: this._prefix, version: this._version, kinds: this._kinds,
            oauth2: this._oauth2, procedures: this._procedures, extension_structure: this._extension_structure, policy: this._policy};
        return provider;
    }

    get prefix(): string {
        return this._prefix;
    }

    get oauth2(): any {
        return this._oauth2;
    }

    get policy(): any {
        return this._policy
    }

    public withPolicy(value?: any) {
        if (value === undefined) {
            this._policy = undefined
        } else {
            this._policy = value
        }
        return this;
    }

    get extensionStructure() {
        return this._extension_structure;
    }

    public withExtensionStructure(value?: any) {
        if (value === undefined) {
            this._extension_structure = undefined
        } else {
            this._extension_structure = value
        }
        return this;
    }

    public withOAuth2Description(value?: any) {
        if (value === undefined) {
            this._oauth2 = loadYaml("./auth.yaml");
        } else {
            this._oauth2 = value
        }
        return this;
    }

    public withProviderProcedures(callback: string, value?: { [p: string]: Procedural_Signature }) {
        if (value === undefined) {
            const proceduralSignatureForProvider: Procedural_Signature = {
                name: "computeSum",
                argument: loadYaml("./procedure_sum_input.yml"),
                result: loadYaml("./procedure_sum_output.yml"),
                execution_strategy: Procedural_Execution_Strategy.Halt_Intentful,
                procedure_callback: callback
            };
            this._procedures[proceduralSignatureForProvider.name] = proceduralSignatureForProvider;
        }
        return this;
    }

    get providerProcedures(): { [p: string]: Procedural_Signature } {
        return this._procedures;
    }

    get kindProcedures(): { [p: string]: Procedural_Signature } {
        return this._kinds[0].procedures;
    }

    public withKindProcedures(callback: string, value?: { [p: string]: Procedural_Signature }) {
        if (value === undefined) {
            const geolocationComputeProceduralSignature: Procedural_Signature = {
                name: "computeGeolocation",
                argument: loadYaml("./procedure_geolocation_compute_input.yml"),
                result: loadYaml("./procedure_geolocation_compute_input.yml"),
                execution_strategy: Procedural_Execution_Strategy.Halt_Intentful,
                procedure_callback: callback
            };
            if (this._kinds.length >= 1) {
                this._kinds[0].procedures[geolocationComputeProceduralSignature.name] = geolocationComputeProceduralSignature
            } else {
                throw new Error(formatErrorMsg("Kind Procedures", "Kinds"))
            }
        }
        return this;
    }

    get entityProcedures(): { [p: string]: Procedural_Signature } {
        return this._kinds[0].procedures;
    }

    public withEntityProcedures(callback: string, value?: { [p: string]: Procedural_Signature }) {
        if (value === undefined) {
            const proceduralSignatureForKind: Procedural_Signature = {
                name: "moveX",
                argument: loadYaml("./procedure_move_input.yml"),
                result: loadYaml("./location_kind_test_data.yml"),
                execution_strategy: Procedural_Execution_Strategy.Halt_Intentful,
                procedure_callback: callback
            };
            if (this._kinds.length >= 1) {
                this._kinds[0].procedures[proceduralSignatureForKind.name] = proceduralSignatureForKind
            } else {
                throw new Error(formatErrorMsg("Entity Procedures", "Kinds"))
            }
        }
        return this;
    }
    get kinds(): Kind[] {
        return this._kinds;
    }

    public withKinds(value?: Kind[]) {
        if (value === undefined) {
            this._kinds = [getSpecOnlyEntityKind()];
        } else {
            this._kinds = value;
        }
        return this;
    }

    get version(): Version {
        return this._version;
    }

    public withVersion(value: Version) {
        this._version = value;
        return this;
    }
}

export function getProviderWithSpecOnlyEnitityKindNoOperations(): Provider {
    const spec_only_kind = getSpecOnlyEntityKind();
    const providerPrefix = randomString(12);
    const providerVersion = "0.1.0";
    const provider: Provider = { prefix: providerPrefix, version: providerVersion, kinds: [spec_only_kind], procedures: {}, extension_structure: {} };
    return provider;
}

export function getProviderWithSpecOnlyEnitityKindWithOperations(procedure_callback: Provider_Callback_URL): Provider {
    const provider: Provider = getProviderWithSpecOnlyEnitityKindNoOperations();
    const proceduralSignatureForKind: Procedural_Signature = {
        name: "moveX",
        argument: loadYaml("./procedure_move_input.yml"),
        result: loadYaml("./location_kind_test_data.yml"),
        execution_strategy: Procedural_Execution_Strategy.Halt_Intentful,
        procedure_callback: procedure_callback
    };
    provider.kinds[0].procedures[proceduralSignatureForKind.name] = proceduralSignatureForKind;
    const proceduralSignatureForProvider: Procedural_Signature = {
        name: "computeSum",
        argument: loadYaml("./procedure_sum_input.yml"),
        result: loadYaml("./procedure_sum_output.yml"),
        execution_strategy: Procedural_Execution_Strategy.Halt_Intentful,
        procedure_callback: procedure_callback
    };
    provider.procedures[proceduralSignatureForProvider.name] = proceduralSignatureForProvider;
    const geolocationComputeProceduralSignature: Procedural_Signature = {
        name: "computeGeolocation",
        argument: loadYaml("./procedure_geolocation_compute_input.yml"),
        result: loadYaml("./procedure_geolocation_compute_input.yml"),
        execution_strategy: Procedural_Execution_Strategy.Halt_Intentful,
        procedure_callback: procedure_callback
    };
    provider.kinds[0].procedures[geolocationComputeProceduralSignature.name] = geolocationComputeProceduralSignature;
    return provider;
}

export function getProviderWithSpecOnlyEntityKindWithOperationsAndOAuth2Description(procedure_callback: Provider_Callback_URL): Provider {
    const provider: Provider = getProviderWithSpecOnlyEnitityKindNoOperations();
    const proceduralSignatureForKind: Procedural_Signature = {
        name: "moveX",
        argument: loadYaml("./procedure_move_input.yml"),
        result: loadYaml("./location_kind_test_data.yml"),
        execution_strategy: Procedural_Execution_Strategy.Halt_Intentful,
        procedure_callback: procedure_callback
    };
    provider.kinds[0].procedures[proceduralSignatureForKind.name] = proceduralSignatureForKind;
    const proceduralSignatureForProvider: Procedural_Signature = {
        name: "computeSum",
        argument: loadYaml("./procedure_sum_input.yml"),
        result: loadYaml("./procedure_sum_output.yml"),
        execution_strategy: Procedural_Execution_Strategy.Halt_Intentful,
        procedure_callback: procedure_callback
    };
    provider.procedures[proceduralSignatureForProvider.name] = proceduralSignatureForProvider;
    const geolocationComputeProceduralSignature: Procedural_Signature = {
        name: "computeGeolocation",
        argument: loadYaml("./procedure_geolocation_compute_input.yml"),
        result: loadYaml("./procedure_geolocation_compute_input.yml"),
        execution_strategy: Procedural_Execution_Strategy.Halt_Intentful,
        procedure_callback: procedure_callback
    };
    provider.kinds[0].procedures[geolocationComputeProceduralSignature.name] = geolocationComputeProceduralSignature;
    provider.oauth2 = loadYaml("./auth.yaml");
    return provider;
}
