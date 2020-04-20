import * as winston from 'winston'
import { LoggerFactory, LoggerOptions } from "./typescript_sdk_interface"
import { Format } from 'logform';

// TODO: This is not available in a web context.  If the SDK is ever intended
// for use directly in a browser, we will need to find an alternative to
// util.inspect() for pretty-printing JS objects.
import * as util from 'util'

export class WinstonLoggerFactory implements LoggerFactory {
    public options: LoggerOptions

    constructor(options: LoggerOptions) {
        this.options = options
    }

    createLogger(options?: LoggerOptions): winston.Logger {
        const opts: LoggerOptions = Object.assign(
            {}, this.options, options ? options : {})
        const formatArgs: Format[] = [winston.format.timestamp()]

        if (opts.logPath) {
            formatArgs.push(winston.format.label({label: opts.logPath}))
        }

        if (! opts.format) {
            opts.format = (process.env.NODE_ENV === 'production') ? 'json' : 'pretty'
        }

        switch (opts.format) {
        case 'json':
            formatArgs.push(winston.format.json())
            break
        case 'pretty':
            const inspect_opts = {colors: true, depth: 3, maxStringLength: 120,
                                  sorted: true, getters: true}
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
                    msg = `${msg} -- ${util.inspect(extra, inspect_opts)}`
                }

                return msg
            }))
            break
        }

        const winstonFormat = winston.format.combine(...formatArgs)
        const logger = winston.createLogger({
            levels: winston.config.syslog.levels,
            level: opts.level || "info",
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
}
