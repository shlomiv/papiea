import { Kind } from "../papiea";
import { Metadata, Spec, Status, uuid4 } from "../core";
import { UserAuthInfo } from "../auth/authn";

export interface Entity_API {
    get_kind(user: UserAuthInfo, prefix: string, kind: string): Promise<Kind>

    save_entity(user: UserAuthInfo, kind: Kind, spec_description: Spec, status_description?: Status): Promise<[Metadata, Spec]>

    get_entity_spec(user: UserAuthInfo, kind: Kind, entity_uuid: uuid4): Promise<[Metadata, Spec]>

    get_entity_status(user: UserAuthInfo, kind: Kind, entity_uuid: uuid4): Promise<[Metadata, Status]>

    filter_entity_spec(user: UserAuthInfo, kind: Kind, fields: any): Promise<[Metadata, Spec][]>

    filter_entity_status(user: UserAuthInfo, kind: Kind, fields: any): Promise<[Metadata, Status][]>

    update_entity_spec(user: UserAuthInfo, uuid: uuid4, spec_version: number, kind: Kind, spec_description: any): Promise<[Metadata, Spec]>

    delete_entity_spec(user: UserAuthInfo, kind: Kind, entity_uuid: uuid4): Promise<void>

    call_procedure(user: UserAuthInfo, kind: Kind, entity_uuid: uuid4, procedure_name: string, input: any): Promise<any>
}