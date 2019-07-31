import { Secret } from "papiea-core";

export class SecretImpl<T> implements Secret<T> {
    _secret: T

    constructor(secret: T) {
        this._secret = secret
    }

    getSecret(): T {
        return this._secret
    }

    setSecret(secret: T) {
        this._secret = secret
    }
}