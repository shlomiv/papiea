import { ProceduralCtx, Provider as ProviderImpl, Provider_Power } from "./typescript_sdk_interface";
import { Data_Description, Entity, Version } from "../core";
import { Kind, Procedural_Execution_Strategy, Provider, SpecOnlyEntityKind } from "../papiea";
import axios from "axios"
import { plural } from "pluralize"
import { Provider_Sdk_Settings } from "./typescript_sdk_settings";


export class ProviderSdk implements ProviderImpl {
    private _version: Version | null;
    private _prefix: string | null;
    private _kind: Kind[];
    _provider: Provider | null;
    papiea_url: string;
    papiea_port: number;


    constructor(papiea_url: string, papiea_port: number) {
        this._version = null;
        this._prefix = null;
        this._kind = [];
        this._provider = null;
        this.papiea_url = papiea_url;
        this.papiea_port = papiea_port;
    }

    get provider() {
        if (this._provider !== null) {
            return this._provider
        } else {
            throw Error("Provider not created")
        }
    }

    get entity_url(): string {
        return `http://${this.papiea_url}:${this.papiea_port}/entity`
    }

    new_kind(entity_description: Data_Description): Kind {
        if (Object.keys(entity_description).length === 0) {
            throw new Error("Wrong kind description specified")
        }
        const name = Object.keys(entity_description)[0];
        if (entity_description[name].hasOwnProperty("x-papiea-entity")) {
            if (entity_description[name]["x-papiea-entity"] === "spec-only") {
                const spec_only_kind: SpecOnlyEntityKind = {
                    name,
                    name_plural: plural(name),
                    kind_structure: entity_description,
                    validator_fn: {} as (entity: Entity) => boolean,
                    intentful_signatures: new Map(),
                    dependency_tree: new Map(),
                    procedures: new Map(),
                    differ: undefined,
                    semantic_validator_fn: undefined
                };
                this._kind.push(spec_only_kind);
                return spec_only_kind;
            } else {
                //TODO: process non spec-only
                throw new Error("Unimplemented")
            }
        } else {
            throw new Error("Malformed yaml");
        }
    }

    add_kind(kind: Kind): boolean {
        if (this._kind.indexOf(kind) === -1) {
            this._kind.push(kind);
            return true;
        } else {
            return false;
        }
    }

    remove_kind(kind: Kind): boolean {
        const found_idx = this._kind.indexOf(kind);
        if (found_idx !== -1) {
            this._kind.splice(found_idx, 1);
            return true;
        } else {
            return false;
        }
    }

    version(version: Version): void {
        this._version = version;
    }

    prefix(prefix: string) {
        this._prefix = prefix;
    }

    async register(): Promise<void> {
        if (this._prefix !== null && this._version !== null && this._kind.length !== 0) {
            this._provider = {kinds: [...this._kind], version: this._version, prefix: this._prefix};
            try {
                await axios.post(`http://${this.papiea_url}:${this.papiea_port}/provider/`, this._provider)
                //Do we set all fields to null again?
            } catch (err) {
                throw err;
            }
        } else if (this._prefix === null) {
            ProviderSdk.provider_description_error("prefix")
        } else if (this._version === null) {
            ProviderSdk.provider_description_error("version")
        } else if (this._kind.length === 0) {
            ProviderSdk.provider_description_error("kind")
        }
    }

    procedure(name: string, rbac: any,
              strategy: Procedural_Execution_Strategy,
              input_desc: string,
              output_desc: string,
              handler: (ctx: ProceduralCtx, input: any) => any): void {
        throw new Error("Unimplemented")

    }

    power(state: Provider_Power): Provider_Power {
        throw new Error("Unimplemented")
    }

    static provider_description_error(missing_field: string) {
        throw new Error(`Malformed provider description. Missing: ${missing_field}`)
    }

    static create_sdk(settings: Provider_Sdk_Settings): ProviderSdk {
        return new ProviderSdk(settings.core.host, settings.core.port)
    }
}