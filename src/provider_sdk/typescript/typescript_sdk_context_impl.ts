import { ProceduralCtx_Interface } from "./typescript_sdk_interface";
import * as core from "../../core";
import { Entity } from "../../core";

export class ProceduralCtx implements ProceduralCtx_Interface {

    base_url: string;
    provider_prefix: string;


    constructor(base_url: string, provider_prefix: string) {
        this.base_url = base_url;
        this.provider_prefix = provider_prefix;
    }

    url_for(entity: Entity): string {
        return `${this.base_url}/${this.provider_prefix}/${entity.metadata.kind}/${entity.metadata.uuid}`
    }

    update_status(metadata: core.Metadata, status: core.Status): boolean {
        throw new Error("Unimplemented")
    }

    update_progress(message: string, done_percent: number): boolean {
        throw new Error("Unimplemented")
    }
}