import * as winston from 'winston'
import { NextFunction, Request } from "express"
import Logger from './logger_interface'
import { safeJSONParse } from "./utils/utils"
import { Format } from 'logform';

export function getLoggingMiddleware(logger: Logger) {
    return async (req: Request, res: any, next: NextFunction): Promise<void> => {
        let end = res.end;
        (<any>res).end = (chunk: any, encoding?: string) => {
            res.end = end;
            res.end(chunk, encoding);
            if (chunk) {
                const stringChunk = chunk && chunk.toString();
                res.body = (safeJSONParse(chunk) || stringChunk);
            }
        };
        res.on("finish", () => {
            const logmsg: { [key: string]: any }  = {
                'Request IP': req.ip,
                'Method': req.method,
                'URL': req.originalUrl,
                'Headers': req.headers,
                'Status code': res.statusCode,
                'Response body': res.body,
                'Time': new Date(),
            };
            if (req.method !== "GET") {
                logmsg["Request body"] = req.body;
            }
            logger.info(logmsg);
        });
        next();
    }
}

export class WinstonLogger implements Logger {
    private logger: winston.Logger;
    private readonly logLevels = new Map<string[], string>()
        .set(["emerg", "alert", "crit", "error", "warning", "notice", "info"], "Audit")
        .set(["debug"], "Debug")

    constructor(logLevel: string, prettyPrint?: boolean) {
        let formatArgs: Format[] = [winston.format.json()]
        if (!this.isValidLevel(logLevel)) {
            this.error(`Unsupported logging level: ${logLevel}`)
            // convert message to "warning", for lack of better knowledge
            logLevel = "warning"
        }
        if (prettyPrint) {
            formatArgs.push(winston.format.prettyPrint())
        }
        const securityLevel = this.getSecurityLevel(logLevel)
        formatArgs.push(winston.format.label({ label: `Security level: ${securityLevel}` }))
        let winstonFormat = winston.format.combine(...formatArgs);
        this.logger = winston.createLogger({
            levels: winston.config.syslog.levels,
            level: logLevel,
            exitOnError: false,
            format: winstonFormat,
            transports: [
                new winston.transports.Console({
                    format: winstonFormat
                })
            ],
        });
    }

    private getSecurityLevel(logLevel: string): string {
        for (let [levelSet, securityLevel] of this.logLevels.entries()) {
            if (levelSet.includes(logLevel)) {
                return securityLevel
            }
        }
        throw new Error("Encountered log level that is not assigned to any security level")
    }

    private isValidLevel(logLevel: string): boolean {
        for (let levelSet of this.logLevels.keys()) {
            if (levelSet.includes(logLevel)) {
                return true
            }
        }
        return false
    }

    public setLoggingLevel(logLevel: string) {
        if (!this.isValidLevel(logLevel)) {
            throw new Error("Unsupported logging level");
        }
        this.logger.level = logLevel;
    }

    public emerg(msg: any, ...messages: any[]): void {
        messages.push({ Time: new Date() })
        this.logger.emerg(msg, messages);
    }

    public alert(msg: any, ...messages: any[]): void {
        messages.push({ Time: new Date() })
        this.logger.alert(msg, messages);
    }

    public crit(msg: any, ...messages: any[]): void {
        messages.push({ Time: new Date() })
        this.logger.crit(msg, messages);
    }

    public error(msg: any, ...messages: any[]): void {
        messages.push({ Time: new Date() })
        this.logger.error(msg, messages);
    }

    public warning(msg: any, ...messages: any[]): void {
        messages.push({ Time: new Date() })
        this.logger.warning(msg, messages);
    }

    public notice(msg: any, ...messages: any[]): void {
        messages.push({ Time: new Date() })
        this.logger.notice(msg, messages);
    }

    public info(msg: any, ...messages: any[]): void {
        messages.push({ Time: new Date() })
        this.logger.info(msg, messages);
    }

    public debug(msg: any, ...messages: any[]): void {
        messages.push({ Time: new Date() })
        this.logger.debug(msg, messages);
    }
}
