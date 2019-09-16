import * as winston from 'winston'
import * as path from "path"
import { LoggerFactory } from "./typescript_sdk_interface"

export function makeLoggerFactory(procedureName: string): LoggerFactory {
    return new WinstonLoggerFactory(procedureName)
}

export class WinstonLoggerFactory implements LoggerFactory {
    public procedureName: string

    constructor(procedureName: string) {
        this.procedureName = procedureName
    }

    createLogger(logPath?: string, logLevel?: string): winston.Logger {
        let winstonFormat: any
        // Check if the module is used in import, then log the importer filename
        if (require.main) {
            winstonFormat = winston.format.combine(winston.format.label({ label: `${ require.main.filename } - ${ this.procedureName }` }), winston.format.json(), winston.format.prettyPrint())
        } else {
            winstonFormat = winston.format.combine(winston.format.label({ label: `${ this.procedureName }` }), winston.format.json(), winston.format.prettyPrint())
        }
        const logger = winston.createLogger({
            levels: winston.config.syslog.levels,
            level: logLevel || "info",
            exitOnError: false,
            format: winstonFormat,
            transports: [
                new winston.transports.File({
                    filename: logPath ?
                        path.resolve(".", `./logs/${ logPath }`) :
                        path.resolve(".", `./logs/${ this.procedureName }.log`),
                    format: winstonFormat
                }),
                new winston.transports.Console({
                    format: winstonFormat
                }),
            ],
            exceptionHandlers: [
                new winston.transports.File({
                    filename: logPath ?
                        path.resolve(__dirname, `./logs/${ logPath }`) :
                        path.resolve(__dirname, `./logs/${ this.procedureName }_${ logPath }_exceptions.log`),
                    format: winstonFormat
                }),
            ]
        })
        return logger
    }
}