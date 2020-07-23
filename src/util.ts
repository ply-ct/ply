export function timestamp(date: Date, locale: string): string {
    const millis = String(date.getMilliseconds()).padStart(3, '0');
    return `${date.toLocaleString(locale, { hour12: false })}:${millis}`;
}

export function lines(input: string): string[] {
    return input.split(/\r?\n/);
}