import { AbstractConfigSetLevels } from "winston/lib/winston/config"
import { IncomingHttpHeaders } from "http"
import { UserAuthInfo } from "./auth/authn"
import { Request } from "express"

export interface PapieaLogLevels extends AbstractConfigSetLevels {
    emerg: number;
    alert: number;
    crit: number;
    error: number;
    audit: number
    warning: number;
    notice: number;
    info: number;
    debug: number;
}

export interface Logger {

    setLoggingLevel(logLevel: string): void

    emerg(msg: any, ...messages: any[]): void

    alert(msg: any, ...messages: any[]): void

    crit(msg: any, ...messages: any[]): void

    error(msg: any, ...messages: any[]): void

    warning(msg: any, ...messages: any[]): void

    notice(msg: any, ...messages: any[]): void

    info(msg: any, ...messages: any[]): void

    debug(msg: any, ...messages: any[]): void

    audit(msg: any, ...messages: any[]): void
}

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

export interface AuditLogger {
    log(req: Request, res: any): void
}
