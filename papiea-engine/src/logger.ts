import * as winston from 'winston'
import { NextFunction, Request } from "express"
import { safeJSONParse } from "./utils/utils"
import { Format } from 'logform'
import { AuditLogger, AuditLogMessage, Logger, PapieaLogLevels } from "./logger_interface"
import { UserAuthInfoRequest } from "./auth/authn"

const papieaLogLevels: PapieaLogLevels = {
    emerg: 0,
    alert: 1,
    crit: 2,
    error: 3,
    audit: 4,
    warning: 5,
    notice: 6,
    info: 7,
    debug: 8
}

export function getLoggingMiddleware(auditLogger: AuditLogger) {
    return async (req: Request, res: any, next: NextFunction): Promise<void> => {
        let end = res.end;
        (<any>res).end = (chunk: any, encoding?: string) => {
            res.end = end
            res.end(chunk, encoding)
            if (chunk) {
                const stringChunk = chunk && chunk.toString()
                res.body = (safeJSONParse(chunk) || stringChunk)
            }
        }
        res.on("finish", () => {
            auditLogger.log(req, res)
        })
        next()
    }
}

export class WinstonLogger implements Logger {
    private logger: winston.Logger
    private readonly logLevels = ["emerg", "alert", "crit", "error", "warning", "notice", "info", "debug", "audit"]

    constructor(logLevel: string, prettyPrint?: boolean) {
        let formatArgs: Format[] = [winston.format.json(), winston.format.timestamp()]
        if (!this.isValidLevel(logLevel)) {
            this.error(`Unsupported logging level: ${ logLevel }`)
            // convert message to "warning", for lack of better knowledge
            logLevel = "warning"
        }
        if (prettyPrint) {
            formatArgs.push(winston.format.prettyPrint())
        }
        let winstonFormat = winston.format.combine(...formatArgs)
        this.logger = winston.createLogger({
            levels: papieaLogLevels,
            level: logLevel,
            exitOnError: false,
            format: winstonFormat,
            transports: [
                new winston.transports.Console({
                    format: winstonFormat
                })
            ],
        })
    }

    private isValidLevel(logLevel: string): boolean {
        return this.logLevels.includes(logLevel)
    }

    public setLoggingLevel(logLevel: string) {
        if (!this.isValidLevel(logLevel)) {
            throw new Error("Unsupported logging level")
        }
        this.logger.level = logLevel
    }

    public emerg(msg: any, ...messages: any[]): void {
        this.logger.emerg(msg, messages)
    }

    public alert(msg: any, ...messages: any[]): void {
        this.logger.alert(msg, messages)
    }

    public crit(msg: any, ...messages: any[]): void {
        this.logger.crit(msg, messages)
    }

    public error(msg: any, ...messages: any[]): void {
        this.logger.error(msg, messages)
    }

    public warning(msg: any, ...messages: any[]): void {
        this.logger.warning(msg, messages)
    }

    public notice(msg: any, ...messages: any[]): void {
        this.logger.notice(msg, messages)
    }

    public info(msg: any, ...messages: any[]): void {
        this.logger.info(msg, messages)
    }

    public debug(msg: any, ...messages: any[]): void {
        this.logger.debug(msg, messages)
    }

    public audit(msg: any, ...messages: any[]): void {
        this.logger.log("audit", msg, messages)
    }
}

export class WinstonAuditLogger extends WinstonLogger implements AuditLogger {
    constructor(papieaDebug?: boolean) {
        super("audit", papieaDebug || false)
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
        this.audit(logmsg)
    }
}