import { Log, LogOptions, LogLevel } from './log';
import { Storage } from './storage';

export const isLogger = (log: Log): log is Logger => {
    return (log as Logger).isPlyLogger === true;
};

interface Options extends LogOptions {
    level: LogLevel;
    prettyIndent: number;
}

export class Logger implements Log {
    readonly isPlyLogger = true;
    enabled = true;

    readonly options: Options;

    constructor(options?: LogOptions, public storage?: Storage, append = false) {
        this.options = {
            level: LogLevel.info,
            prettyIndent: 0,
            ...(options || {})
        };
        if (storage && !append) {
            storage.remove();
        }
    }

    log(message: string, obj?: any): void;
    log(level: LogLevel, message: string, obj?: any): void;
    log(levelOrMessage: LogLevel | string, messageOrObj: string | any, logObj?: any) {
        let level = LogLevel.info;
        let message = '' + messageOrObj;
        let obj: any = logObj;
        if (typeof levelOrMessage === 'string') {
            message = levelOrMessage;
            obj = messageOrObj;
        } else {
            level = levelOrMessage;
        }
        if (level <= this.options.level) {
            if (level === LogLevel.error) {
                if (obj) {
                    if (obj.stack) {
                        console.error(message);
                        console.error(obj.stack);
                    } else {
                        console.error(
                            message + ': ' + JSON.stringify(obj, null, this.options.prettyIndent)
                        );
                    }
                } else {
                    console.error(message);
                }
            } else {
                if (obj) {
                    if (obj.stack) {
                        console.log(message);
                        console.log(obj);
                    } else {
                        console.log(
                            message + ': ' + JSON.stringify(obj, null, this.options.prettyIndent)
                        );
                    }
                } else {
                    console.log(message);
                }
            }
            if (this.storage) {
                this.storage.append('' + message);
                if (obj) {
                    if (obj.stack) {
                        this.storage.append('\n' + obj.stack);
                    } else {
                        this.storage.append(
                            ': ' + JSON.stringify(obj, null, this.options.prettyIndent)
                        );
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
        if (!obj && (message as any).message && (message as any).stack) {
            const err = message as any;
            this.log(LogLevel.error, err.message, err);
        } else {
            this.log(LogLevel.error, message, obj);
        }
    }

    debug(message: string, obj?: any) {
        this.log(LogLevel.debug, message, obj);
    }

    get level(): LogLevel {
        return this.options.level;
    }

    toString(): string {
        return this.options.level + ': ' + (this.storage ? this.storage : 'console');
    }
}
