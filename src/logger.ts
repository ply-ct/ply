import { Storage } from './storage';

export enum LogLevel {
    error,
    info,
    debug
}

export class LogOptions {
    level: LogLevel = LogLevel.info;
    prettyIndent: number = 0;
}

export class Logger {

    private options: LogOptions = {
        level: LogLevel.info,
        prettyIndent: 0
    }

    constructor(options?: LogOptions, public storage?: Storage, append = false) {
        if (options) {
            this.options = { ...this.options, ...options };
        }
        if (storage && !append) {
            storage.remove();
        }
    }

    log(level: LogLevel, message: string, obj: any) {
        if (level <= (this.options.level || LogLevel.info)) {
            if (level === LogLevel.error) {
                if (obj) {
                    if (obj.stack) {
                        console.error(message);
                        console.error(obj);
                    }
                    else {
                        console.error(message + ': ' + JSON.stringify(obj, null, this.options.prettyIndent));
                    }
                }
                else {
                    console.error(message);
                }
            }
            else {
                if (obj) {
                    if (obj.stack) {
                        console.log(message);
                        console.log(obj);
                    }
                    else {
                        console.log(message + ': ' + JSON.stringify(obj, null, this.options.prettyIndent));
                    }
                }
                else {
                    console.log(message);
                }
            }
            if (this.storage) {
                this.storage.append(message);
                if (obj) {
                    if (obj.stack) {
                        this.storage.append('\n' + obj.stack);
                    } else {
                        this.storage.append(': ' + JSON.stringify(obj, null, this.options.prettyIndent));
                    }
                }
                this.storage.append('\n');
            }
        }
    }

    info(message: string, obj?: any) {
        this.log(LogLevel.info, message, obj);
    }

    error(message: string, obj?: any) {
        this.log(LogLevel.error, message, obj);
    }

    debug(message: string, obj?: any) {
        this.log(LogLevel.debug, message, obj);
    }

    toString(): string {
        return this.options.level + ': ' + (this.storage ? this.storage : 'console');
    }
}