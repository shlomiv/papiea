import { Version, Entity } from "papiea-core";
import * as autocannon from "autocannon";
import axios from "axios"

export class CrudBenchmarks {
    private readonly full_url: string
    private opts: autocannon.Options
    entities: string[]
    private readonly entity_path: string;

    constructor(papiea_url: string, provider_prefix: string, provider_version: Version, kind_name: string) {
        this.full_url = `${papiea_url}/services/${provider_prefix}/${provider_version}/${kind_name}`
        this.entity_path = `/services/${provider_prefix}/${provider_version}/${kind_name}`
        this.opts = {
            url: this.full_url,
            headers: {
                'Content-Type': 'application/json'
            }
        }
        this.entities = []
    }

    setOpts(opts: Partial<autocannon.Options>) {
        this.opts = {...this.opts, ...opts}
    }

    async runCreate() {
        const sample_entity = {
            spec: {
                x: 10,
                y: 122
            }
        }
        const json_body = JSON.stringify(sample_entity)
        const opts = {...this.opts}
        opts.method = "POST"
        opts.body = json_body
        opts.title = "Create entity benchmark"
        const result = await autocannon(opts)
        console.log(result)
        this.entities = await this.getCreatedEntities()
    }

    async getCreatedEntities(): Promise<string[]> {
        const result = await axios.get(this.full_url)
        return result.data.results.map((entity: Entity) => entity.metadata.uuid)
    }

    async deleteEntities() {
        for (let uuid of this.entities) {
            try {
                await axios.delete(`${ this.full_url }/${ uuid }`)
            } catch (e) {
            }
        }
    }

    async runRead() {
        const requests = this.entities.map(uuid => {
            return { path: `${ this.entity_path }/${ uuid }` }
        })
        const opts = {...this.opts}
        opts.url = `${this.full_url}/${this.entities[0]}`
        opts.method = "GET"
        opts.title = "Read all entities one by one benchmark"
        opts.requests = requests
        const result = await autocannon(opts)
        console.log(result)
    }

    async runUpdate() {
        const sample_update = {
            spec: {
                x: 20,
                y: 500
            },
            metadata: {
                spec_version: 1
            }
        }
        const requests = this.entities.map(uuid => {
            return { path: `${ this.entity_path }/${ uuid }` }
        })
        const json_body = JSON.stringify(sample_update)
        const opts = {...this.opts}
        opts.url = `${this.full_url}/${this.entities[0]}`
        opts.method = "PUT"
        opts.body = json_body
        opts.title = "Update entity benchmark"
        opts.requests = requests
        const result = await autocannon(opts)
        console.log(result)
    }

    async runDelete() {
        const requests = this.entities.map(uuid => {
            return { path: `${ this.entity_path }/${ uuid }` }
        })
        const opts = {...this.opts}
        opts.url = `${this.full_url}/${this.entities[0]}`
        opts.method = "DELETE"
        opts.title = "Delete all entities one by one benchmark"
        opts.requests = requests
        const result = await autocannon(opts)
        console.log(result)
        await this.deleteEntities()
    }
}