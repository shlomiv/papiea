import { Metadata, Spec, Status, uuid4, Version } from "../core";

export interface Entity_API {
    save_entity(prefix: string, kind_name: string, version: Version, spec_description: Spec, request_metadata: Metadata): Promise<[Metadata, Spec]>

    get_entity_spec(kind_name: string, entity_uuid: uuid4): Promise<[Metadata, Spec]>

    get_entity_status(kind_name: string, entity_uuid: uuid4): Promise<[Metadata, Status]>

    filter_entity_spec(kind_name: string, fields: any): Promise<[Metadata, Spec][]>

    filter_entity_status(kind_name: string, fields: any): Promise<[Metadata, Status][]>

    update_entity_spec(uuid: uuid4, prefix: string, spec_version: number, kind_name: string, version: Version, spec_description: any): Promise<[Metadata, Spec]>

    delete_entity_spec(kind_name: string, entity_uuid: uuid4): Promise<void>

    call_procedure(prefix: string, kind_name: string, version: Version, entity_uuid: uuid4, procedure_name: string, input: any): Promise<any>

    call_kind_procedure(prefix: string, kind_name: string, version: Version, procedure_name: string, input: any): Promise<any>

    call_provider_procedure(prefix: string, version: Version, procedure_name: string, input: any): Promise<any>
}