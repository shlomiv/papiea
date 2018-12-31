import {Kind} from "../papiea";
import {Metadata, Spec, uuid4} from "../core";

export interface IEntityAPI {
    get_kind(prefix: string, kind: string): Promise<Kind>

    save_entity(kind: Kind, spec_description: any, status_description?: any): Promise<[Metadata, Spec]>

    get_entity_spec(kind: Kind, entity_uuid: uuid4): Promise<[Metadata, Spec]>

    filter_entity_spec(kind: Kind, fields: any): Promise<[Metadata, Spec][]>

    update_entity_spec(kind: Kind, spec_description: any): Promise<[Metadata, Spec]>

    delete_entity_spec(kind: Kind, entity_uuid: uuid4): Promise<boolean>
}