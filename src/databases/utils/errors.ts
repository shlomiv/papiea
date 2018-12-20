import {Metadata, Spec} from "../../core";

export class ConflictingEntityError extends Error {

    existing_metadata: Metadata;
    existing_spec: Spec;

    constructor(msg: string, metadata: Metadata, spec: Spec) {
        super(msg);
        this.existing_metadata = metadata;
        this.existing_spec = spec;
    }
}