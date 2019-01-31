import { ProceduralCtx_Interface, Provider as ProviderImpl, Provider_Power } from "./typescript_sdk_interface";
import { Data_Description, Entity, Version } from "../core";
import { Kind, Procedural_Execution_Strategy, Procedural_Signature, Provider, SpecOnlyEntityKind } from "../papiea";
import axios from "axios"
import { plural } from "pluralize"
import * as express from "express";
import * as asyncHandler from "express-async-handler";
import { Express } from "express";
import { Server } from "http";
import { ProceduralCtx } from "./typescript_sdk_context_impl";

export class ProviderSdk implements ProviderImpl {
    private _version: Version | null;
    private _prefix: string | null;
    private _kind: Kind[];
    _provider: Provider | null;
    papiea_url: string;
    papiea_port: number;
    private _port: number;
    private _host: string;
    private _server: null | Express;
    private _running: null | Server;


    constructor(papiea_url: string, papiea_port: number, public_host = "127.0.0.1", public_port = 9000) {
        this._version = null;
        this._prefix = null;
        this._kind = [];
        this._provider = null;
        this.papiea_url = papiea_url;
        this.papiea_port = papiea_port;
        this._port = public_port;
        this._host = public_host;
        this._server = null;
        this._running = null;
    }

    get provider() {
        if (this._provider !== null) {
            return this._provider
        } else {
            throw Error("Provider not created")
        }
    }

    get entity_url(): string {
        return `http://${ this.papiea_url }:${ this.papiea_port }/entity`
    }

    private get_prefix(): string {
        if (this._prefix !== null) {
            return this._prefix
        } else {
            throw new Error("Prefix is not set")
        }
    }

    get server(): Server {
        if (this._running !== null) {
            return this._running;
        } else {
            throw Error("Server is not created")
        }
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
                    intentful_signatures: new Map(),
                    dependency_tree: new Map(),
                    procedures: {},
                    differ: undefined,
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
            this._provider = { kinds: [...this._kind], version: this._version, prefix: this._prefix };
            try {
                await axios.post(`http://${ this.papiea_url }:${ this.papiea_port }/provider/`, this._provider);
                if (this._server !== null) {
                    this._running = this._server.listen(this._port, () => {
                        console.log(`Server running at http://localhost:${ this._port }/`);
                    });
                }
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
              input_desc: any,
              output_desc: any,
              handler: (ctx: ProceduralCtx_Interface, entity: Entity, input: any) => Promise<any>,
              specified_kind_name?: string): void {
        const callback_url = `http://${ this._host }:${ this._port }${ "/" + name }`;
        const procedural_signature: Procedural_Signature = {
            name,
            argument: input_desc,
            result: output_desc,
            execution_strategy: strategy,
            procedure_callback: callback_url
        };
        if (specified_kind_name === null) {

            //TODO: Static provider methods logic
            throw new Error("Unimplemented")
        }
        const kind_idx = this._kind.findIndex(kind => kind.name === specified_kind_name);
        if (kind_idx === -1) {
            throw new Error("Kind not found")
        }
        const found_kind = this._kind[kind_idx];
        found_kind.procedures[name] = procedural_signature;
        let app: Express;
        if (this._server !== null) {
            app = this._server;
        } else {
            app = express();
            app.use(express.json());
            this._server = app;
        }
        if (this._prefix === null) {
            throw new Error("Provider prefix is not set")
        }
        app.post("/" + name, asyncHandler(async (req, res) => {
            try {
                const result = await handler(new ProceduralCtx(this.entity_url, this.get_prefix()), {
                    metadata: req.body.metadata,
                    spec: req.body.spec,
                    status: req.body.status
                }, req.body.input);
                res.json(result.spec);
            } catch (e) {
                throw new Error("Unable to execute handler");
            }
        }));
    }

    power(state: Provider_Power): Provider_Power {
        throw new Error("Unimplemented")
    }

    static provider_description_error(missing_field: string) {
        throw new Error(`Malformed provider description. Missing: ${ missing_field }`)
    }

    static create_sdk(papiea_host: string, papiea_port: number, public_host?: string, public_port?: number): ProviderSdk {
        return new ProviderSdk(papiea_host, papiea_port, public_host, public_port)
    }
}