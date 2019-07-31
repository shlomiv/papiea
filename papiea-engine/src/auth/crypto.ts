import { Secret } from "papiea-core";

const crypto = require("crypto");

export function createHash(obj: any): string {
    return crypto.createHash('sha256')
        .update(JSON.stringify(obj)).digest('base64');
}

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