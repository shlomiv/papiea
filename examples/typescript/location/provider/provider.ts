import { ProviderSdk } from "../../../../src/provider_sdk/typescript_sdk";
import { Procedural_Execution_Strategy, Procedural_Signature, Provider } from "../../../../src/papiea";
import axios from "axios";


export async function register_provider(sdk: ProviderSdk, cfg: any): Promise<Provider> {

    //Specify the provider kind, version & prefix
    const location = sdk.new_kind(cfg.provider.kind_description);
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
    location.entity_procedure(proceduralSignature.name, {}, proceduralSignature.execution_strategy, proceduralSignature.argument, proceduralSignature.result,  async (ctx, entity, input) => {
        entity.spec.x += input;
        const res = await axios.put(ctx.url_for(entity), {
            spec: entity.spec,
            metadata: entity.metadata
        });
        return res.data;
    });

    try {
        //Register the provider with papiea SDK instance
        //Starts an Express server with a handler for entity_procedure
        await sdk.register()
    } catch (e) {
        console.error(e)
    }

    return sdk.provider;
}