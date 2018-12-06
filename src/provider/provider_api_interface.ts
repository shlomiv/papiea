// This will be provided using REST APIs. 

enum Provider_Power {On, Off, Suspended};

interface Provider_API {

    // TODO: Turn this to REST
    
    // Registers a provider to the Provider's DB
    // POST "/provider"
    register_provider(provider:Kind):boolean

    // DELETE "/provider/{prefix}/{version}"
    unregister_provider(provider_prefix: string, version: Version):boolean

    // Updating status and progress
    // POST "/provider/update_status"
    update_status(context: any, entity_ref: Entity_Reference, status: Status);

    // POST "/provider/update_progress"
    update_progress(context: any, message:string, done_percent:number);

    // Binny wants to rename this
    // POST "/provider/{prefix}/{version}/power"
    power(power_state:Provider_Power);
}
