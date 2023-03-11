export enum LogLevel {
    error,
    info,
    debug
}

export interface LogOptions {
    level?: LogLevel;
    prettyIndent?: number;
}

export interface Log {
    info(message: string, obj?: any): void;
    error(message: string, obj?: any): void;
    debug(message: string, obj?: any): void;
    enabled: boolean;
    level: LogLevel;
}

export class ConsoleLogger implements Log {
    enabled = true;
    level: LogLevel;

    constructor(readonly isDebug = false) {
        this.level = isDebug ? LogLevel.debug : LogLevel.info;
    }

    log(message: string, obj?: any, err = false) {
        const fn = err ? console.error : console.log;
        fn(message);
        if (obj !== undefined) {
            if (obj.stack) {
                fn(message);
                fn(obj);
            } else {
                fn(message + ': ' + JSON.stringify(obj, null, 2));
            }
        } else {
            fn(message);
        }
    }

    info(message: string, obj?: any) {
        this.log(message, obj);
    }

    error(message: string, obj?: any) {
        this.log(message, obj);
    }

    debug(message: string, obj?: any) {
        if (this.isDebug) {
            this.log(message, obj);
        }
    }
}
