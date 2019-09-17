import { AbstractConfigSetLevels } from "winston/lib/winston/config"

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
