import { Request, Response, NextFunction } from "express";

export interface UserAuthInfoRequest extends Request {
    user: UserAuthInfo
}

export interface UserAuthInfo {
    owner: string,
    tenant?: string
}

export interface UserAuthRequestHandler {
    (req: UserAuthInfoRequest, res: Response, next: NextFunction): any;
}

export function asyncHandler(fn: UserAuthRequestHandler): any {
    return (req: Request, res: Response, next: NextFunction) => {
        let requestWrapper: UserAuthInfoRequest = <UserAuthInfoRequest>req;
        const fnReturn = fn(requestWrapper, res, next);
        return Promise.resolve(fnReturn).catch(next);
    };
}

// Just for autotests
export function simple_authn(req: Request, res: Response, next: NextFunction) {
    let requestWrapper: UserAuthInfoRequest = <UserAuthInfoRequest>req;
    requestWrapper.user = {
        owner: req.header('Owner') || 'anonymous',
        tenant: req.header('Tenant')
    }
    next();
}