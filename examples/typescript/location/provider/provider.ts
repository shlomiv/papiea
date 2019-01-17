import { ProviderSdk } from "../../../../src/provider_sdk/typescript_sdk";
import { Procedural_Execution_Strategy, Procedural_Signature, Provider } from "../../../../src/papiea";
import axios from "axios";


export async function register_provider(sdk: ProviderSdk, cfg: any): Promise<Provider> {

    //Specify the provider kind, version & prefix
    sdk.new_kind(cfg.provider.kind_description);
    sdk.version(cfg.provider.version);
    sdk.prefix(cfg.provider.prefix);

    const proceduralSignature: Procedural_Signature = {
        name: cfg.procedures.moveX.name,
        argument: cfg.procedures.moveX.input_desc,
        result: cfg.procedures.moveX.output_desc,
        execution_strategy: Procedural_Execution_Strategy.Halt_Intentful,
        procedure_callback: cfg.procedures.moveX.callback
    };

    //Registers a procedures on papiea instance
    sdk.procedure(proceduralSignature.name, {}, proceduralSignature.execution_strategy, proceduralSignature.argument, proceduralSignature.result, cfg.procedures.moveX.callback, async (ctx, entity, input) => {
        entity.spec.x += input;
        axios.put(`${ sdk.entity_url }/location_provider/${ entity.metadata.kind }/${ entity.metadata.uuid }`, {
            spec: entity.spec,
            metadata: entity.metadata
        })
    }, "Location");

    try {
        //Register the provider with papiea SDK instance
        //Starts an Express server with a handler for procedure
        await sdk.register()
    } catch (e) {
        console.error(e)
    }

    return sdk.provider;
}