import * as osLocale from 'os-locale';

export function locale() {
    let locale = osLocale.sync();
    if (!locale || locale.toLocaleLowerCase() === 'c') {
        locale = 'en-US';
    }
    return locale;
}

/**
 * turn a date into a timestamp based on the OS locale
 */
export function timestamp(date: Date, withTimeZone = false): string {
    const millis = String(date.getMilliseconds()).padStart(3, '0');
    const tz = withTimeZone ? date.toTimeString().substring(date.toTimeString().indexOf(' ')) : '';
    return `${date.toLocaleString(locale(), { hour12: false })}:${millis}${tz}`;
}

/**
 * Remove windows newline characters (\r)
 */
export function newlines(input: string): string {
    return input.replace(/\r/g, '');
}

/**
 * split a string into an array of lines, ignoring escaped
 */
export function lines(input: string): string[] {
    return input.split(/\r?\n/);
}

/**
 * substitute a forward slash for all backslashes
 */
export function fwdSlashes(path: string): string {
    return path.replace(/\\/g, '/');
}

export function genId(): string {
    // TODO: consider microseconds or nanoseconds (process.hrtime())
    return Date.now().toString(16);
}
