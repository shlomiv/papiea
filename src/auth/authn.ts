import { Request, Response, NextFunction } from "express";

export interface UserAuthInfo {
    owner: string,
    tenant?: string,
    // For tests
    doNotCheck?: boolean
}

// For tests
export function test_authn(req: Request, res: Response, next: NextFunction) {
    req.params.user = {
        owner: req.header('Owner') || 'anonymous',
        tenant: req.header('Tenant'),
        doNotCheck: req.header('Owner') === undefined
    };
    next();
}