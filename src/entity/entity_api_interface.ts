import { Metadata, Spec, Status, uuid4 } from "../core";

export interface Entity_API {
    save_entity(kind_name: string, spec_description: Spec, status_description?: Status): Promise<[Metadata, Spec]>
    get_kind(prefix: string, kind: string, version: string): Promise<Kind>

    get_entity_spec(kind_name: string, entity_uuid: uuid4): Promise<[Metadata, Spec]>

    get_entity_status(kind_name: string, entity_uuid: uuid4): Promise<[Metadata, Status]>

    filter_entity_spec(kind_name: string, fields: any): Promise<[Metadata, Spec][]>

    filter_entity_status(kind_name: string, fields: any): Promise<[Metadata, Status][]>

    update_entity_spec(uuid: uuid4, spec_version: number, kind_name: string, spec_description: any): Promise<[Metadata, Spec]>

    delete_entity_spec(kind_name: string, entity_uuid: uuid4): Promise<void>

    call_procedure(kind_name: string, entity_uuid: uuid4, procedure_name: string, input: any): Promise<any>

    call_kind_procedure(kind_name: string, procedure_name: string, input: any): Promise<any>

    call_provider_procedure(prefix: string, procedure_name: string, input: any): Promise<any>
}