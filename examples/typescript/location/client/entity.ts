import axios from "axios"
import { Metadata, Spec } from "../../../../src/core";

export async function create_entity(prefix: string, kind_name: string, request_spec: Spec, entity_url: string): Promise<[Metadata, Spec]> {
    const { data: { metadata, spec } } = await axios.post(`${ entity_url }/${ prefix }/${ kind_name }`, {
        spec: request_spec
    });
    return [metadata, spec];
}

export async function update_entity(prefix: string, kind_name: string, request_spec: Spec, request_metadata: Metadata, entity_url: string): Promise<[Metadata, Spec]> {
    const { data: { metadata, spec } } = await axios.put(`${ entity_url }/${ prefix }/${ kind_name }/${ request_metadata.uuid }`, {
        spec: request_spec,
        metadata: {
            spec_version: request_metadata.spec_version
        }
    });
    return [metadata, spec]
}

export async function delete_entity(prefix: string, kind_name: string, request_metadata: Metadata, entity_url: string): Promise<void> {
    await axios.delete(`${ entity_url }/${ prefix }/${ kind_name }/${ request_metadata.uuid }`);
}

export async function invoker_procedure(prefix: string, kind_name: string, procedure_name: string, input: any, request_metadata: Metadata, entity_url: string): Promise<any> {
    const res = await axios.post(`${ entity_url }/${ prefix }/${ kind_name }/${ request_metadata.uuid }/procedure/${procedure_name}`, { input: input });
    return res.data;
}