// [[file:~/work/papiea-js/Papiea-design.org::*Typescript:%20/src/provider_sdk/typescript_sdk_interface][Typescript: /src/provider_sdk/typescript_sdk_interface:1]]
import * as core from "../core";
import {Kind} from "../papiea";
import { Provider_Callback_URL } from "../core";
import { Entity } from "../core";

// [[file:~/work/papiea-js/Papiea-design.org::#h-Providers-SDK-518][provider_sdk_ts_provider_interface]]
// Api for the provider-sdk
export enum Provider_Power {On, Off, Suspended};

export interface Provider {
    new_kind(entity_yaml:core.Data_Description):Kind;
    version(version: core.Version):void;
    power(state: Provider_Power): Provider_Power;

    procedure(name: string, rbac: any,
              strategy: Procedural_Execution_Strategy,
              input_desc: any,
              output_desc: any,
              handler: (ctx: ProceduralCtx_Interface, entity: Entity, input: any) => Promise<any>,
              specified_kind_name?: string): void
}
// provider_sdk_ts_provider_interface ends here

// [[file:~/work/papiea-js/Papiea-design.org::#h-Providers-SDK-518][provider_sdk_ts_kind_interface]]
enum Procedural_Execution_Strategy {Halt_Intentful};

interface IKindImpl {

    // Adds an intentful handler. Dispatched based on the signautre passed
    on(signature: string, name: string, rbac: any, handler: (ctx:IntentfulCtx_Interface, entity:any)=>void):Intentful_Handler;

    // Convenient functions for constructing/destructing an entity. Could be implemented in terms of "on above"
    on_new(name: string, rbac: any, handler: (ctx:IntentfulCtx_Interface, entity:any)=>void):void;
    on_del(name: string, rbac: any, handler: (ctx:IntentfulCtx_Interface, entity:any)=>void):void;

    // Adds a procedural behaviour to the entity
    procedure(name: string, rbac: any,
              strategy: Procedural_Execution_Strategy,
              input_desc: string,
              output_desc: string,
              handler: (ctx:ProceduralCtx_Interface, input:any)=>any):void;


    // Visualize all the intentful handlers and their priority
    visualize_intentful_handlers(filename:string):boolean;
}
// provider_sdk_ts_kind_interface ends here

// [[file:~/work/papiea-js/Papiea-design.org::#h-Providers-SDK-518][provider_sdk_ts_intentful_handler_interface]]
export interface Intentful_Handler {
    // Establishes a dependency tree between the various handlers
    before(...handlers: Intentful_Handler[]):void;
}
// provider_sdk_ts_intentful_handler_interface ends here

// [[file:~/work/papiea-js/Papiea-design.org::#h-Providers-SDK-518][provider_sdk_ts_intentful_ctx_interface]]
export interface IntentfulCtx_Interface {
    update_status(metadata: core.Metadata, status: core.Status):boolean;
    update_progress(message:string, done_percent:number):boolean;

    url_for(entity: Entity): string;
}

// For the time being these are equal. Later they may differ
export type ProceduralCtx_Interface=IntentfulCtx_Interface;
// provider_sdk_ts_intentful_ctx_interface ends here
// Typescript: /src/provider_sdk/typescript_sdk_interface:1 ends here
