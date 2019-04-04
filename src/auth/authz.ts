import { UserAuthInfo } from "./authn";
const casbin = require("casbin");

export class PermissionDeniedError extends Error {
    constructor() {
        super("Permission Denied");
        Object.setPrototypeOf(this, PermissionDeniedError.prototype);
    }
}

export interface Authorizer {
    checkPermission(user: UserAuthInfo, object: any, action: any): void
}

export class NoAuthAuthorizer implements Authorizer {
    checkPermission(user: UserAuthInfo, object: any, action: any): void {
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

    checkPermission(user: UserAuthInfo, object: any, action: any): void {
        if (!this.enforcer.enforce(user, object, action)) {
            throw new PermissionDeniedError();
        }
    }
}

export class CasbinAllowAnonymousAuthorizer extends CasbinAuthorizer {
    checkPermission(user: UserAuthInfo, object: any, action: any): void {
        if (user.owner === 'anonymous') {
            return;
        }
        super.checkPermission(user, object, action);
    }
}