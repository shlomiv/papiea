import { NextFunction, Request, RequestHandler } from 'express'
import { IncomingHttpHeaders } from 'http'

import { Logger } from 'papiea-backend-utils'

import { UserAuthInfo, UserAuthInfoRequest } from "./auth/authn"
import { safeJSONParse } from "./utils/utils"

export interface AuditLogMessage {
    request_ip: string,
    method: string,
    url: string,
    headers: IncomingHttpHeaders,
    status_code: number,
    response_body: any,
    request_body?: any,
    user?: UserAuthInfo
}

export class AuditLogger {
    private readonly _logger: Logger
    private readonly _debug: boolean

    constructor(logger: Logger, debug?: boolean) {
        this._logger = logger
        this._debug = debug ?? false
    }

    middleware(): RequestHandler {
        return (req, res, next) => {
            const end = res.end;
            let body: any;
            res.end = (chunk: any, encoding?: any, cb?: any): void => {
                res.end = end
                res.end(chunk, encoding, cb)
                if (chunk) {
                    const stringChunk = chunk && chunk.toString()
                    body = (safeJSONParse(chunk) || stringChunk)
                }
            }
            res.on("finish", () => {
                (<any>res).body = body
                this.log(req, res)
            })
            next()
        }
    }

    log(req: Request, res: any) {
        const logmsg: AuditLogMessage = {
            request_ip: req.ip,
            method: req.method,
            url: req.originalUrl,
            headers: req.headers,
            status_code: res.statusCode,
            response_body: res.body,
        }
        if (req.method !== "GET") {
            logmsg.request_body = req.body
        }
        if ((req as UserAuthInfoRequest).user) {
            logmsg.user = (req as UserAuthInfoRequest).user
        }
        this._logger.audit(logmsg)
    }
}
