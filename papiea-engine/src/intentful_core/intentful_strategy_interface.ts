import { Metadata, Spec, Entity_Reference, Kind } from "papiea-core"

export interface IntentfulStrategy {

    setKind(kind: Kind): void

    // Intentful spec and status update
    // Additionally this should call Diff Engine
    update(metadata: Metadata, spec: Spec): Promise<[Metadata, Spec]>


    // Intentful delete
    // Additionally this might need to call Diff for cleanup procedures
    delete(entityRef: Entity_Reference): Promise<void>
}