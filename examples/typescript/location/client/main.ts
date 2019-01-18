import { create_entity, delete_entity, invoker_procedure, update_entity } from "./entity";
import { location_entity_config, provider_config } from "./config";

async function main() {

    const [metadata] = await create_entity(provider_config.prefix, provider_config.kind_name, location_entity_config.entity.initial_spec, provider_config.entity_url);

    //Update entity on provider with kind
    await update_entity(provider_config.prefix, provider_config.kind_name, location_entity_config.entity.update_spec, metadata, provider_config.entity_url);

    //Invoke procedure that moves X by value of input
    const res = await invoker_procedure(provider_config.prefix, provider_config.kind_name, provider_config.procedure_name, location_entity_config.entity.procedure_input, metadata, provider_config.entity_url);
    console.log(res);

    //Delete entity on provider with kind
    await delete_entity(provider_config.prefix, provider_config.kind_name, metadata, provider_config.entity_url);
}

main().then().catch(err => {
    console.error(err)
});