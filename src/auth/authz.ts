import { UserAuthInfo } from "./authn";
import { Provider_API } from "../provider/provider_api_interface";
import { Provider } from "../papiea";
import { newEnforcer } from "casbin/lib/casbin";
import { Adapter } from "casbin/lib/persist/adapter";
import { Model } from "casbin/lib/model";
import { Helper } from "casbin/lib/persist/helper";

export class PermissionDeniedError extends Error {
    constructor() {
        super("Permission Denied");
        Object.setPrototypeOf(this, PermissionDeniedError.prototype);
    }
}

export class Action {
    private action: string;

    constructor(action: string) {
        this.action = action;
    }

    getAction(): string {
        return this.action;
    }
}

const ReadAction = new Action('read'),
    UpdateAction = new Action('write'),
    CreateAction = new Action('create'),
    DeleteAction = new Action('delete');

export { ReadAction, UpdateAction, CreateAction, DeleteAction };

export function CallProcedureByNameAction(procedureName: string) {
    return new Action('call' + procedureName);
}

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

    abstract checkPermission(user: UserAuthInfo, object: any, action: Action): Promise<void>;

    async filter(user: UserAuthInfo, objectList: any[], transformfn: (object: any) => any, action: Action): Promise<any[]> {
        return filterAsync(objectList, async (object) => {
            try {
                await this.checkPermission(user, transformfn(object), action);
                return true;
            } catch (e) {
                return false;
            }
        });
    }
}

export class NoAuthAuthorizer extends Authorizer {
    async checkPermission(user: UserAuthInfo, object: any, action: Action): Promise<void> {
    }
}

export class CasbinAuthorizer extends Authorizer {
    private pathToModel: string;
    private pathToPolicyOrAdaptor: string;
    private enforcer: any;

    constructor(pathToModel: string, pathToPolicyOrAdaptor: any) {
        super();
        this.pathToModel = pathToModel;
        this.pathToPolicyOrAdaptor = pathToPolicyOrAdaptor;
    }

    async init() {
        this.enforcer = await newEnforcer(this.pathToModel, this.pathToPolicyOrAdaptor);
    }

    async checkPermission(user: UserAuthInfo, object: any, action: Action): Promise<void> {
        if (!this.enforcer.enforce(user, object, action.getAction())) {
            throw new PermissionDeniedError();
        }
    }
}

// For tests, check perms only if user info is present,
// otherwise allows autotests to call endpoints without auth
export class TestAuthorizer extends Authorizer {
    private authorizerToBeTested: Authorizer;

    constructor(authorizerToBeTested: Authorizer) {
        super();
        this.authorizerToBeTested = authorizerToBeTested;
    }

    async checkPermission(user: UserAuthInfo, object: any, action: Action): Promise<void> {
        if (user.doNotCheck) {
            return;
        }
        this.authorizerToBeTested.checkPermission(user, object, action);
    }
}

class CasbinMemoryAdapter implements Adapter {
    public readonly policy: string;

    constructor(policy: string) {
        this.policy = policy;
    }

    async loadPolicy(model: Model): Promise<void> {
        if (!this.policy) {
            throw new PermissionDeniedError();
        }
        await this.loadPolicyFile(model, Helper.loadPolicyLine);
    }

    private async loadPolicyFile(model: any, handler: (line: string, model: Model) => void): Promise<void> {
        const lines = this.policy.split('\n');
        lines.forEach((n: string, index: number) => {
            const line = n.trim();
            if (!line) {
                return;
            }
            handler(n, model);
        });
    }

    savePolicy(model: Model): Promise<boolean> {
        throw new Error('not implemented');
    }

    addPolicy(sec: string, ptype: string, rule: string[]): Promise<void> {
        throw new Error('not implemented');
    }

    removePolicy(sec: string, ptype: string, rule: string[]): Promise<void> {
        throw new Error('not implemented');
    }

    removeFilteredPolicy(sec: string, ptype: string, fieldIndex: number, ...fieldValues: string[]): Promise<void> {
        throw new Error('not implemented');
    }
}

export interface ProviderAuthorizerFactory {
    createAuthorizer(provider: Provider): Promise<Authorizer>;
}

export class ProviderCasbinAuthorizerFactory implements ProviderAuthorizerFactory {
    private pathToDefaultModel: string;

    constructor(pathToDefaultModel: string) {
        this.pathToDefaultModel = pathToDefaultModel;
    }

    async createAuthorizer(provider: Provider): Promise<Authorizer> {
        if (!provider || !provider.policy) {
            throw new PermissionDeniedError();
        }
        const authorizer = new CasbinAuthorizer(this.pathToDefaultModel, new CasbinMemoryAdapter(provider.policy));
        await authorizer.init();
        return authorizer;
    }
}

export class PerProviderAuthorizer extends Authorizer {
    private providerApi: Provider_API;
    private providerToAuthorizer: { [key: string]: Authorizer; };
    private kindToProviderPrefix: { [key: string]: string; };
    private providerAuthorizerFactory: ProviderAuthorizerFactory;

    constructor(providerApi: Provider_API, providerAuthorizerFactory: ProviderAuthorizerFactory) {
        super();
        this.providerApi = providerApi;
        this.providerToAuthorizer = {};
        this.kindToProviderPrefix = {};
        this.providerAuthorizerFactory = providerAuthorizerFactory;
    }

    private async getProviderPrefixByKindName(user: UserAuthInfo, kind_name: string): Promise<string> {
        if (kind_name in this.kindToProviderPrefix) {
            return this.kindToProviderPrefix[kind_name];
        }
        const provider: Provider = await this.providerApi.get_latest_provider_by_kind(user, kind_name);
        if (!provider) {
            throw new PermissionDeniedError();
        }
        this.kindToProviderPrefix[kind_name] = provider.prefix;
        return provider.prefix;
    }

    private async getAuthorizerByObject(user: UserAuthInfo, object: any): Promise<Authorizer> {
        if (!object.metadata || !object.metadata.kind) {
            throw new PermissionDeniedError();
        }
        const providerPrefix = await this.getProviderPrefixByKindName(user, object.metadata.kind);
        if (providerPrefix in this.providerToAuthorizer) {
            return this.providerToAuthorizer[providerPrefix];
        }

        const provider: Provider = await this.providerApi.get_latest_provider(user, providerPrefix);
        const authorizer = await this.providerAuthorizerFactory.createAuthorizer(provider);
        this.providerToAuthorizer[providerPrefix] = authorizer;
        return authorizer;
    }

    async checkPermission(user: UserAuthInfo, object: any, action: Action): Promise<void> {
        const authorizer: Authorizer = await this.getAuthorizerByObject(user, object);
        return authorizer.checkPermission(user, object, action);
    }
}