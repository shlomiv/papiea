import * as autocannon from "autocannon";

export function autocannon_mutate_req(opts: autocannon.Options, initial_state: any, update_func: (state: any) => any) {
    return new Promise((resolve, reject) => {
        const instance = autocannon(opts, (err: Error, res: any) => {
            resolve(res);
        })
        let state = initial_state
        instance.on("response", (client, statusCode, returnBytes, responseTime) => {
            state = update_func(state)
            client.setBody(JSON.stringify(state))
        })
        instance.on("error", (err) => {
            reject(err)
        })
    });
}