import {
    ProceduralCtx,
    Provider as IProviderImpl,
    Provider_Power
} from "./typescript_sdk_interface";
import {Data_Description, Entity, Version} from "../core";
import {Kind, Procedural_Execution_Strategy, Provider, SpecOnlyEnitityKind} from "../papiea";
import axios from "axios"
import {plural} from "pluralize"

export class ProviderSdk implements IProviderImpl {
    private _version: Version | null;
    private _prefix: string | null;
    private _kind: Kind[];
    provider: Provider | null;


    constructor() {
        this._version = null;
        this._prefix = null;
        this._kind = [];
        this.provider = null;
    }

    new_kind(entity_yaml: Data_Description): Kind {
        if (Object.keys(entity_yaml).length === 0) {
            throw new Error("Wrong kind description specified")
        }
        const name = Object.keys(entity_yaml)[0];
        if (entity_yaml[name].hasOwnProperty("x-papiea-entity")) {
            if (entity_yaml[name]["x-papiea-entity"] === "spec-only") {
                const spec_only_kind: SpecOnlyEnitityKind = {
                    name,
                    name_plural: plural(name),
                    kind_structure: entity_yaml,
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

    register(): void {
        if (this._prefix !== null && this._version !== null && this._kind.length !== 0) {
            this.provider = {kinds: [...this._kind], version: this._version, prefix: this._prefix};
            try {
                //TODO: set this in global variable
                axios.post("127.0.0.1:3000/provider/", this.provider)
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
}