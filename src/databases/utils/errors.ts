import {Metadata, Spec} from "../../core";

export class MongoDuplicateEntityError extends Error {

    metadata: Metadata;
    spec: Spec;

    constructor(msg: string, metadata: Metadata, spec: Spec) {
        super(msg);
        this.metadata = metadata;
        this.spec = spec;
    }
}