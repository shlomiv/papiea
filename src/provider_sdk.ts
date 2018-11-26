// Api for the provider-sdk

enum ProviderPower {On, Off, Suspended};

interface Provider {
    new_kind(entity_yaml:string):Kind;
    version(major:number, minor:number, build: number, extra: string):void;
    power(state: ProviderPower): ProviderPower;
}

enum ProceduralExecStrategy {HaltIntentful};

interface Kind {

    // Adds an intentful handler. Dispatched based on the signautre passed
    on(signature: string, name: string, rbac: any, handler: (ctx:IntentfulCtx, entity:any)=>void):IntentfulHandler;

    // Convenient functions for constructing/destructing an entity. Could be implemented in terms of "on above"
    on_new(name: string, rbac: any, handler: (ctx:IntentfulCtx, entity:any)=>void):void;
    on_del(name: string, rbac: any, handler: (ctx:IntentfulCtx, entity:any)=>void):void;

    // Adds a procedural behaviour to the entity
    procedure(name: string, rbac: any,
              strategy: ProceduralExecStrategy,
              input_desc: string,
              output_desc: string,
              handler: (ctx:ProceduralCtx, input:any)=>any):void;


    // Visualize all the intentful handlers and their priority
    visualize_intentful_handlers(filename:string):boolean;
}

interface IntentfulHandler {
    // Establishes a dependency tree between the various handlers
    before(...handlers: IntentfulHandler[]):void;
}

interface IntentfulCtx {
    update_status(metadata:any, status: any):boolean;
    update_progress(message:string, done_percent:number):boolean;
}

// For the time being these are equal. Later they may differ
type ProceduralCtx=IntentfulCtx;
