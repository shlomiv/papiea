import { UserAuthInfo } from "./authn";
const casbin = require("casbin");

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

export interface Authorizer {
    checkPermission(user: UserAuthInfo, object: any, action: Action): void
}

export class NoAuthAuthorizer implements Authorizer {
    checkPermission(user: UserAuthInfo, object: any, action: Action): void {
    }
}

export class CasbinAuthorizer implements Authorizer {
    private pathToModel: string;
    // TODO(adolgarev): strore policy in db and provide endpoints to manage them
    private pathToPolicy: string;
    private enforcer: any;

    constructor(pathToModel: string, pathToPolicy: string) {
        this.pathToModel = pathToModel;
        this.pathToPolicy = pathToPolicy;
    }

    async init() {
        this.enforcer = await casbin.newEnforcer(this.pathToModel, this.pathToPolicy);
    }

    checkPermission(user: UserAuthInfo, object: any, action: Action): void {
        if (!this.enforcer.enforce(user, object, action.getAction())) {
            throw new PermissionDeniedError();
        }
    }
}

// For tests, check perms only if user info is present,
// otherwise allows autotests to call endpoints without auth
export class TestAuthorizer implements Authorizer {
    private authorizerToBeTested: Authorizer;

    constructor(authorizerToBeTested: Authorizer) {
        this.authorizerToBeTested = authorizerToBeTested;
    }

    checkPermission(user: UserAuthInfo, object: any, action: Action): void {
        if (user.doNotCheck) {
            return;
        }
        this.authorizerToBeTested.checkPermission(user, object, action);
    }
}