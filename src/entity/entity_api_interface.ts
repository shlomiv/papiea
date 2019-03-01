import { Kind } from "../papiea";
import { Metadata, Spec, Status, uuid4 } from "../core";

export interface EntityApiInterface {
    get_kind(prefix: string, kind: string): Promise<Kind>

    save_entity(kind: Kind, spec_description: Spec, status_description?: Status): Promise<[Metadata, Spec]>

    get_entity_spec(kind: Kind, entity_uuid: uuid4): Promise<[Metadata, Spec]>

    get_entity_status(kind: Kind, entity_uuid: uuid4): Promise<[Metadata, Status]>

    filter_entity_spec(kind: Kind, fields: any): Promise<[Metadata, Spec][]>

    filter_entity_status(kind: Kind, fields: any): Promise<[Metadata, Status][]>

    update_entity_spec(uuid: uuid4, spec_version: number, kind: Kind, spec_description: any): Promise<[Metadata, Spec]>

    delete_entity_spec(kind: Kind, entity_uuid: uuid4): Promise<void>

    call_procedure(kind: Kind, entity_uuid: uuid4, procedure_name: string, input: any): Promise<any>
}