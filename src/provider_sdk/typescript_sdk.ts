import {
    ProceduralCtx,
    Provider as IProviderImpl,
    Provider_Power
} from "./typescript_sdk_interface";
import {Data_Description, Entity, Version} from "../core";
import {Kind, Procedural_Execution_Strategy, Provider, SpecOnlyEnitityKind} from "../papiea";
import axios from "axios"

export class ProviderSdk implements IProviderImpl {
    provider: Provider;
    kind: Kind | null;

    constructor() {
        this.kind = null;
        this.provider = {prefix: "", version: "", kinds: []};
    }

    new_kind(entity_yaml: Data_Description): Kind {
        if (Object.keys(entity_yaml).length === 0) {
            throw new Error("Wrong kind description specified")
        }
        const name = Object.keys(entity_yaml)[0];
        if (entity_yaml.hasOwnProperty("x-papiea-entity") && entity_yaml["x-papiea-entity"] === "spec-only") {
            const spec_only_kind: SpecOnlyEnitityKind = {
                name,
                name_plural: undefined,
                kind_structure: entity_yaml,
                validator_fn: {} as (entity: Entity) => boolean,
                intentful_signatures: new Map(),
                dependency_tree: new Map(),
                procedures: new Map(),
                differ: undefined,
                semantic_validator_fn: undefined
            };
            this.kind = spec_only_kind;
            return spec_only_kind;
        } else {
            //TODO: process non spec-only
            throw new Error("Unimplemented");
        }
    }

    version(version: Version): void {
        this.provider.version = version;
    }

    prefix(prefix: string) {
        this.provider.prefix = prefix;
    }

    register(): void {
        if (this.provider.prefix !== "" && this.provider.version !== "" && this.provider.kinds.length !== 0) {
            try {
                axios.post("/provider", this.provider)
            } catch (err) {
                throw err;
            }
        } else {
            throw new Error("Malformed provider description")
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
}