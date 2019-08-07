import {Md5} from 'ts-md5/dist/md5'

export class TokenStore {
    private tokens:any = {};
        /**
     * add_token
     */
    public add_token(token: string): string {
        const token_hash = <string> Md5.hashAsciiStr(token)
        this.tokens[token_hash] = token
        return token_hash
    }

    /**
     * get_token
     */
    public get_token(hash: string) {
        return this.tokens[hash]
    }
}

export const tokenStore = new TokenStore()