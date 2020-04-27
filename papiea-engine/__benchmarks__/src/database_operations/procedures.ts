import { Version } from "papiea-core";
import * as autocannon from "autocannon";
import { Benchmarks } from "../base_benchmark";

export class ProcedureBenchmarks extends Benchmarks {
    private entity: string | null;

    constructor(papiea_url: string, provider_prefix: string, provider_version: Version, kind_name: string) {
        super(papiea_url, provider_prefix, provider_version, kind_name)
        this.entity = null
    }

    async runEntityProcedure(name: string) {
        if (!this.entity) {
            this.entity = await this.createEntity(this.full_url)
        }
        const json_body = JSON.stringify({ input: 5 })
        const opts = { ...this.opts }
        opts.method = "POST"
        opts.body = json_body
        opts.title = "Entity procedure benchmark"
        opts.url = `${ this.full_url }/${ this.entity }/procedure/${ name }`
        const result = await autocannon(opts)
        console.log(result)
        await this.deleteEntity(this.full_url, this.entity)
    }

    async runKindProcedure(name: string) {
        const json_body = JSON.stringify({ input: "2" })
        const opts = { ...this.opts }
        opts.method = "POST"
        opts.body = json_body
        opts.title = "Kind procedure benchmark"
        opts.url = `${ this.full_url }/procedure/${ name }`
        const result = await autocannon(opts)
        console.log(result)
    }

    async runProviderProcedure(name: string) {
        const json_body = JSON.stringify({ input: { a: 2, b: 2 } })
        const opts = { ...this.opts }
        opts.method = "POST"
        opts.body = json_body
        opts.title = "Provider procedure benchmark"
        opts.url = `${ this.papiea_url }/services/${ this.provider_prefix }/${ this.provider_version }/procedure/${ name }`
        const result = await autocannon(opts)
        console.log(result)
    }
}