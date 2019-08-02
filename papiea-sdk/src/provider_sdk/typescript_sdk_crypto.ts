import { Secret } from "papiea-core";

export class SecretImpl implements Secret {
    private secret: any

    constructor(secret: any) {
        this.secret = secret
    }

    getSecret(): any {
        return this.secret
    }

    setSecret(secret: any) {
        this.secret = secret
    }
}
