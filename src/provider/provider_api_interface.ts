// This will be provided using REST APIs. 

enum Provider_Power {On, Off, Suspended};

interface Provider_API {

    // TODO: Turn this to REST
    
    // Registers a provider to the Provider's DB
    // POST "/provider"
    register_provider(provider:Provider_Kind):boolean

    // DELETE "/provider/{uuid}"
    unregister_provider(provider_uuid: string):boolean

    // Updating status and progress
    // POST "/provider/{uuid}/update_status"
    update_status(context: any, metadata: Metadata, status: Status);

    // POST "/provider/{uuid}/update_progress"
    update_progress(context: any, message:string, done_percent:number);

    // Binny wants to rename this
    // POST "/provider/{uuid}/power"
    power(power_state:Provider_Power);
}
