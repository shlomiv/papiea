const jwt = require("jsonwebtoken"),
    util = require("util"),
    jwtVerify = util.promisify(jwt.verify),
    jwtSign = util.promisify(jwt.sign);

export interface Signature {
    sign(data: any): Promise<string>;

    verify(token: string): Promise<any>;
}

export class JWTHMAC implements Signature {
    private secret: string;

    constructor(secret: string) {
        this.secret = secret;
    }

    async sign(data: any): Promise<string> {
        return jwtSign(data, this.secret);
    }

    async verify(token: string): Promise<any> {
        return jwtVerify(token, this.secret);
    }
}
