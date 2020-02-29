import { Storage } from './storage';

export enum LogLevel {
    error,
    info,
    debug
}

export interface LogOptions {
    level?: LogLevel;
    retain?: boolean;
    location?: string;
    name?: string;
}

export class Logger {

    private options: LogOptions = {
        level: LogLevel.info,
        retain: true
    }

    private readonly storage?: Storage;

    constructor(options?: LogOptions) {
        if (options) {
            this.options = Object.assign({}, this.options, options);
        }
        if (this.options.location && this.options.name) {
            this.storage = new Storage(this.options.location + '/' + this.options.name);
            if (!this.options.retain) {
                this.storage.remove();
            }
        }
    }

    log(level: LogLevel, message: string, obj: any) {
        if (level <= (this.options.level || LogLevel.info)) {
            if (level === LogLevel.error) {
                console.error(message);
                if (obj) {
                    console.error(obj);
                }
            }
            else {
                console.log(message);
                if (obj) {
                    console.log(obj);
                }
            }
            if (this.storage) {
                this.storage.append(message + '\n');
                if (obj) {
                    if (obj.stack) {
                        this.storage.append(obj.stack + '\n');
                    } else {
                        this.storage.append(obj + '\n');
                    }
                }
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