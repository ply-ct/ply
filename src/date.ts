interface Date {
    timestamp(locale: string): string;
}

Date.prototype.timestamp = function(locale: string): string {
    let millis = String(this.getMilliseconds()).padStart(3, '0');
    return `${this.toLocaleString(locale, { hour12: false })}:${millis}`;
};