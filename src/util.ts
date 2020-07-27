/**
 * turn a date into a timestamp based on a given locale
 */
export function timestamp(date: Date, locale: string): string {
    const millis = String(date.getMilliseconds()).padStart(3, '0');
    return `${date.toLocaleString(locale, { hour12: false })}:${millis}`;
}

/**
 * split a string into an array of lines
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