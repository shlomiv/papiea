import axios from "axios";
import { Version } from "papiea-core";
import * as autocannon from "autocannon";

export abstract class Benchmarks {
    protected full_url: string;
    protected provider_prefix: string
    protected provider_version: Version
    protected papiea_url: string
    protected opts: autocannon.Options;

    protected constructor(papiea_url: string, provider_prefix: string, provider_version: Version, kind_name: string) {
        this.full_url = `${papiea_url}/services/${provider_prefix}/${provider_version}/${kind_name}`
        this.papiea_url = papiea_url
        this.provider_prefix = provider_prefix
        this.provider_version = provider_version
        this.opts = {
            url: this.full_url,
            headers: {
                'Content-Type': 'application/json'
            }
        }
    }

    setOpts(opts: Partial<autocannon.Options>) {
        this.opts = {...this.opts, ...opts}
    }

    // Not using Promise.all() here because it fails when ONE of the promises fails
    // Thus it doesn't wait for potentially successfull ones
    protected async deleteEntities(url: string, entities: string[]) {
        for (let uuid of entities) {
            try {
                await axios.delete(`${ url }/${ uuid }`)
            } catch (e) {
            }
        }
    }

    protected async deleteEntity(url: string, uuid: string) {
        await axios.delete(`${ url }/${ uuid }`)
    }

    protected async createEntities(url: string, amount: number): Promise<string[]> {
        let promises = []
        for (let i = 0; i < amount; i++) {
            promises.push(axios.post(url, {
                spec: {
                    x: 1000,
                    y: 1200
                }
            }))
        }
        const result = await Promise.all(promises)
        return result.map(res => res.data.metadata.uuid)
    }

     protected async createEntity(url: string): Promise<string> {
        const result = await axios.post(url, {
            spec: {
                x: 500,
                y: 600
            }
        })
        return result.data.metadata.uuid
    }
}