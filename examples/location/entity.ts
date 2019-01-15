import { Kind, Provider } from "../../src/papiea";
import axios from "axios"
import { Metadata, Spec } from "../../src/core";

export async function create_entity(provider: Provider, kind: Kind, request_spec: Spec, entity_url: string): Promise<[Metadata, Spec]> {
    const { data: { metadata, spec } } = await axios.post(`${ entity_url }/${ provider.prefix }/${ kind.name }`, {
        spec: request_spec
    });
    return [metadata, spec];
}

export async function update_entity(provider: Provider, kind: Kind, request_spec: Spec, request_metadata: Metadata, entity_url: string): Promise<[Metadata, Spec]> {
    const { data: { metadata, spec } } = await axios.put(`${ entity_url }/${ provider.prefix }/${ kind.name }/${ request_metadata.uuid }`, {
        spec: request_spec,
        metadata: {
            spec_version: request_metadata.spec_version
        }
    });
    return [metadata, spec]
}

export async function delete_entity(provider: Provider, kind: Kind, request_metadata: Metadata, entity_url: string): Promise<void> {
    await axios.delete(`${ entity_url }/${ provider.prefix }/${ kind.name }/${ request_metadata.uuid }`);
}