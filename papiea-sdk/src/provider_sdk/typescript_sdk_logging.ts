import * as winston from 'winston'
import { LoggerFactory } from "./typescript_sdk_interface"
import { Format } from 'logform';

export function makeLoggerFactory(procedureName: string): LoggerFactory {
    return new WinstonLoggerFactory(procedureName)
}

export class WinstonLoggerFactory implements LoggerFactory {
    public procedureName: string
    private readonly logLevels = new Map<string[], string>()
        .set(["emerg", "alert", "crit", "error", "warning", "notice", "info"], "Audit")
        .set(["debug"], "Debug")

    constructor(procedureName: string) {
        this.procedureName = procedureName
    }

    createLogger(logLevel: string = "info", prettyPrint?: boolean): winston.Logger {
        let formatArgs: Format[] = [winston.format.json()]
        if (!this.isValidLevel(logLevel)) {
            console.error(`Unsupported log level ${logLevel}`)
            logLevel = "warning"
        }
        if (prettyPrint) {
            formatArgs.push(winston.format.prettyPrint())
        }
        const securityLevel = this.getSecurityLevel(logLevel)
        let label: Format
        // Check if the module is used in import, then log the importer filename
        if (require.main) {
            label = winston.format.label({ label: `Security Level: ${securityLevel}; ${ require.main.filename } - ${ this.procedureName }`})
        } else {
            label = winston.format.label({ label: `Security Level: ${securityLevel}; ${ this.procedureName }`})
        }
        formatArgs.push(label)
        const winstonFormat = winston.format.combine(...formatArgs)
        const logger = winston.createLogger({
            levels: winston.config.syslog.levels,
            level: logLevel || "info",
            exitOnError: false,
            format: winstonFormat,
            transports: [
                new winston.transports.Console({
                    format: winstonFormat
                }),
            ],
            exceptionHandlers: [
                new winston.transports.Console({
                    format: winstonFormat,
                    level: "error"
                }),
            ]
        })
        return logger
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
}