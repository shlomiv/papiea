import { Version } from "papiea-core";
import * as autocannon from "autocannon";
import axios from "axios";

export class ProcedureBenchmarks {
    private full_url: string;
    private provider_prefix: string
    private provider_version: Version
    private papiea_url: string
    private opts: autocannon.Options;
    private entity: string | null;

    constructor(papiea_url: string, provider_prefix: string, provider_version: Version, kind_name: string) {
        this.full_url = `${papiea_url}/services/${provider_prefix}/${provider_version}/${kind_name}`
        this.opts = {
            url: this.full_url,
            headers: {
                'Content-Type': 'application/json'
            }
        }
        this.papiea_url = papiea_url
        this.provider_prefix = provider_prefix
        this.provider_version = provider_version
        this.entity = null
    }

    setOpts(opts: Partial<autocannon.Options>) {
        this.opts = {...this.opts, ...opts}
    }

    private async createEntity(): Promise<string> {
        const result = await axios.post(this.full_url, {
            spec: {
                x: 500,
                y: 600
            }
        })
        return result.data.metadata.uuid
    }

    private async deleteEntity(uuid: string) {
        await axios.delete(`${this.full_url}/${uuid}`)
    }

    async runEntityProcedure(name: string) {
        if (!this.entity) {
            this.entity = await this.createEntity()
        }
        const json_body = JSON.stringify({ input: 5 })
        const opts = {...this.opts}
        opts.method = "POST"
        opts.body = json_body
        opts.title = "Entity procedure benchmark"
        opts.url = `${this.full_url}/${this.entity}/procedure/${name}`
        const result = await autocannon(opts)
        console.log(result)
        await this.deleteEntity(this.entity)
    }

    async runKindProcedure(name: string) {
        const json_body = JSON.stringify({ input: "2" })
        const opts = {...this.opts}
        opts.method = "POST"
        opts.body = json_body
        opts.title = "Kind procedure benchmark"
        opts.url = `${this.full_url}/procedure/${name}`
        const result = await autocannon(opts)
        console.log(result)
    }

    async runProviderProcedure(name: string) {
        const json_body = JSON.stringify({ input: { a: 2, b: 2 } })
        const opts = {...this.opts}
        opts.method = "POST"
        opts.body = json_body
        opts.title = "Provider procedure benchmark"
        opts.url = `${this.papiea_url}/services/${this.provider_prefix}/${this.provider_version}/procedure/${name}`
        const result = await autocannon(opts)
        console.log(result)
    }
}