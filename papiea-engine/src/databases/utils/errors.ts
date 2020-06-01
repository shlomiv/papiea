import { Spec, uuid4, Metadata, Status } from "papiea-core";

export class ConflictingEntityError extends Error {

    existing_metadata: Metadata;
    existing_spec: Spec;
    existing_status?: Status

    constructor(msg: string, metadata: Metadata, spec: Spec, status?: Status) {
        super(msg);
        this.existing_metadata = metadata;
        this.existing_spec = spec;
        this.existing_status = status
    }
}

export class EntityNotFoundError extends Error {

    uuid: uuid4;
    kind: string;

    constructor(kind: string, uuid: uuid4) {
        super();
        this.kind = kind;
        this.uuid = uuid;
    }
}