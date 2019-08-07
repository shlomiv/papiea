function hash_string(str:string):number {
    let hash = 0, i = 0, len = str.length;
    while ( i < len ) {
        hash  = ((hash << 5) - hash + str.charCodeAt(i++)) << 0;
    }
    return hash;
};

export class TokenStore {
    private tokens:any = {};

    /**
     * add_token
     */
    public add_token(token: string): number {
        const token_hash = hash_string(token)
        this.tokens[token_hash] = token
        return token_hash
    }

    /**
     * get_token
     */
    public get_token(hash: number) {
        return this.tokens[hash]
    }
}

export const tokenStore = new TokenStore()