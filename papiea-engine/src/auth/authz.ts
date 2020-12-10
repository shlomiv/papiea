import {UserAuthInfo} from "./authn"
import {Provider_API} from "../provider/provider_api_interface"
import {Action, Provider} from "papiea-core"
import {PermissionDeniedError, UnauthorizedError} from "../errors/permission_error"
import {Logger} from "papiea-backend-utils"

function mapAsync<T, U>(array: T[], callbackfn: (value: T, index: number, array: T[]) => Promise<U>): Promise<U[]> {
    return Promise.all(array.map(callbackfn));
}

async function filterAsync<T>(array: T[], callbackfn: (value: T, index: number, array: T[]) => Promise<boolean>): Promise<T[]> {
    const filterMap = await mapAsync(array, callbackfn);
    return array.filter((value, index) => filterMap[index]);
}

export abstract class Authorizer {
    constructor() {
    }

    abstract checkPermission(user: UserAuthInfo, object: any, action: Action, provider?: Provider): Promise<void>;

    async filter(user: UserAuthInfo, objectList: any[], action: Action, provider?: Provider, transformfn?: (object: any) => any): Promise<any[]> {
        return filterAsync(objectList, async (object) => {
            try {
                if (transformfn) {
                    await this.checkPermission(user, transformfn(object), action, provider);
                } else {
                    await this.checkPermission(user, object, action, provider);
                }
                return true;
            } catch (e) {
                return false;
            }
        });
    }

    on_auth_changed(provider: Readonly<Provider>) {

    }
}

export class NoAuthAuthorizer extends Authorizer {
    async checkPermission(user: UserAuthInfo, object: any, action: Action): Promise<void> {
    }
}

export interface ProviderAuthorizerFactory {
    createAuthorizer(provider: Provider): Promise<Authorizer>;
}

export class PerProviderAuthorizer extends Authorizer {
    private providerToAuthorizer: { [key: string]: Authorizer | null; };
    private kindToProviderPrefix: { [key: string]: string; };
    private providerAuthorizerFactory: ProviderAuthorizerFactory;
    private logger: Logger;

    constructor(logger: Logger, providerAuthorizerFactory: ProviderAuthorizerFactory) {
        super();
        this.providerToAuthorizer = {};
        this.kindToProviderPrefix = {};
        this.providerAuthorizerFactory = providerAuthorizerFactory;
        this.logger = logger;
    }

    on_auth_changed(provider: Readonly<Provider>) {
        delete this.providerToAuthorizer[provider.prefix];
    }

    private async getAuthorizerByObject(provider: Provider): Promise<Authorizer | null> {
        if (provider.prefix in this.providerToAuthorizer) {
            return this.providerToAuthorizer[provider.prefix];
        }
        if (!provider.authModel || !provider.policy) {
            this.providerToAuthorizer[provider.prefix] = null;
            return null;
        }
        const authorizer = await this.providerAuthorizerFactory.createAuthorizer(provider);
        this.providerToAuthorizer[provider.prefix] = authorizer;
        return authorizer;
    }

    async checkPermission(user: UserAuthInfo, object: any, action: Action, provider?: Provider): Promise<void> {
        if (provider === undefined || provider === null) {
            // We shouldn't reach this under normal circumstances
            // TODO: this should hidden, leaving it with this error till we have proper logging
            throw new Error("No provider provided in the authorizer")
        }
        const authorizer: Authorizer | null = await this.getAuthorizerByObject(provider!)
        if (authorizer === null) {
            return;
        }
        if (!user) {
            throw new UnauthorizedError();
        }
        if (user.is_admin) {
            return;
        }
        if (user.is_provider_admin) {
            // For provider-admin provider_prefix must be set
            if (user.provider_prefix === provider!.prefix) {
                return;
            } else {
                throw new PermissionDeniedError();
            }
        }
        return authorizer.checkPermission(user, object, action, provider);
    }
}

export class AdminAuthorizer extends Authorizer {
    async checkPermission(user: UserAuthInfo, object: any, action: Action): Promise<void> {
        if (!user) {
            throw new UnauthorizedError();
        }
        if (user.is_admin) {
            return;
        }
        if (action === Action.CreateS2SKey) {
            // object.user_info contains UserInfo which will be used when s2s key is passed
            // check who can talk on behalf of whom
            if (object.owner !== user.owner || object.user_info.is_admin) {
                throw new PermissionDeniedError();
            }
            if (user.provider_prefix !== undefined
                && object.provider_prefix !== user.provider_prefix) {
                throw new PermissionDeniedError();
            }
            if (user.is_provider_admin) {
                return;
            }
            if (object.user_info.is_provider_admin
                || object.user_info.owner !== user.owner) {
                throw new PermissionDeniedError();
            }
            return;
        }
        if (action === Action.ReadS2SKey || action === Action.InactivateS2SKey) {
            if (object.owner !== user.owner
                || (user.provider_prefix !== undefined && object.provider_prefix !== user.provider_prefix)) {
                throw new PermissionDeniedError();
            } else {
                return;
            }
        }
        if (user.is_provider_admin && object.prefix === user.provider_prefix) {
            return;
        }
        throw new PermissionDeniedError();
    }
}
