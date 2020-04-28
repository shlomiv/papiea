import * as winston from 'winston'
import {Format} from 'logform'

import {inspect} from 'util'

export const LOG_LEVELS = {
    emerg: 0,
    alert: 1,
    crit: 2,
    error: 3,
    warning: 4,
    notice: 5,
    info: 6,
    debug: 7,
}

export type LogLevel = keyof typeof LOG_LEVELS // 'debug' | 'info' | ...

export interface Logger {
    log(level: LogLevel, msg: any, ...messages: any[]): void
    emerg(msg: any, ...messages: any[]): void
    alert(msg: any, ...messages: any[]): void
    crit(msg: any, ...messages: any[]): void
    error(msg: any, ...messages: any[]): void
    warning(msg: any, ...messages: any[]): void
    notice(msg: any, ...messages: any[]): void
    info(msg: any, ...messages: any[]): void
    debug(msg: any, ...messages: any[]): void
}

export type LoggerOptions = {
    logPath?: string,
    level: LogLevel,
    format: 'json' | 'pretty',
}

export class LoggerFactory {
    readonly options: LoggerOptions

    private static readonly INSPECT_OPTIONS = {
        colors: true, depth: 3, maxStringLength: 120,
        sorted: true, getters: true
    }

    private static readonly PRODUCTION =
        (process?.env?.NODE_ENV === 'production')

    public static nested(parent: LoggerFactory,
                         options: Partial<LoggerOptions>): LoggerFactory
    {
        return new LoggerFactory(LoggerFactory.mergeOptions(
            parent.options, options))
    }

    constructor(options: Partial<LoggerOptions>) {
        this.options = LoggerFactory.mergeOptions({
            level: 'info',
            format: LoggerFactory.PRODUCTION ? 'json' : 'pretty',
        }, options)
    }

    createLogger(options?: Partial<LoggerOptions>): Logger {
        const opts = LoggerFactory.mergeOptions(this.options, options ?? {})
        const formatArgs: Format[] = [winston.format.timestamp()]

        if (opts.logPath) {
            formatArgs.push(winston.format.label({label: opts.logPath}))
        }

        switch (opts.format) {
        case 'json':
            formatArgs.push(winston.format.json())
            break

        case 'pretty':
            const skip_fields = ['level','timestamp','label','message','stack']

            formatArgs.push(winston.format.errors({stack: true}))
            formatArgs.push(winston.format.colorize())
            formatArgs.push(winston.format.printf(info => {
                let msg = `${info.level}\t`
                if (info.timestamp) msg = `${msg} ${info.timestamp}`
                if (info.label) msg = `${msg} [${info.label}]`

                if (info.stack) {
                    // Stack trace includes the error message, so we only print
                    // the stack if we are given a stack.
                    msg = `${msg} ${info.stack}`
                } else if (info.message !== undefined) {
                    msg = `${msg} ${info.message}`
                }

                const extra: any = {}
                for (let k in info) {
                    if (skip_fields.includes(k)) continue
                    extra[k] = info[k]
                }

                if (Object.keys(extra).length > 0) {
                    msg = `${msg} -- ${LoggerFactory.prettyPrint(extra)}`
                }

                return msg
            }))
            break
        }

        const format = winston.format.combine(...formatArgs)

        const logger = winston.createLogger({
            levels: LOG_LEVELS,
            level: opts.level,
            exitOnError: false,
            format: format,
            transports: [
                new winston.transports.Console({ format: format }),
            ],
            exceptionHandlers: [
                new winston.transports.Console({
                    format: format,
                    level: "error"
                }),
            ]
        })
        return logger
    }

    public static mergeOptions(first: LoggerOptions,
                               ...opts: Partial<LoggerOptions>[]): LoggerOptions
    {
        return opts.reduce<LoggerOptions>((res, opt) => {
            if (opt.logPath) {
                res.logPath = res.logPath ? `${res.logPath}/${opt.logPath}`
                                          : opt.logPath
            }
            if (opt.level) res.level = opt.level
            if (opt.format) res.format = opt.format
            return res
        }, Object.assign({}, first))
    }

    private static prettyPrint(obj: any): string {
        return inspect(obj, LoggerFactory.INSPECT_OPTIONS)
    }
}
