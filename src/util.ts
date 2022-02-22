import * as process from 'process';
import * as fs from 'fs';
import * as osLocale from 'os-locale';

let _locale = osLocale.sync();
if (!_locale || _locale.toLocaleLowerCase() === 'c') {
    _locale = 'en-US';
}
export const locale = _locale;

/**
 * Turn a date into a timestamp based on the OS locale
 * Note: Node/V8 bug causes hour = 24 (https://github.com/nodejs/node/issues/33089)
 * eg: 7/3/2021, 24:52:33:347
 */
export function timestamp(date: Date, withTimeZone = false): string {
    const millis = String(date.getMilliseconds()).padStart(3, '0');
    const tz = withTimeZone ? date.toTimeString().substring(date.toTimeString().indexOf(' ')) : '';
    return `${date.toLocaleString(locale, { hour12: false })}:${millis}${tz}`;
}

/**
 * time in nanoseconds
 */
export function nanoTime(): number {
    const hrTime = process.hrtime();
    return hrTime[0] * 1000000000 + hrTime[1];
}

export function genId(): string {
    return nanoTime().toString(16);
}

/**
 * Expected format is per timestamp() --
 * TODO: Only works for these two locale formats:
 *     MM/DD/YYYY, HH:mm:ss
 *     DD/MM/YYYY, HH:mm:ss (not tested actually)
 */
export function timeparse(time: string): Date | undefined {

    const parser = /(\d+?)\/(\d+?)\/(\d+?), (\d+?):(\d+?):(\d+?):(\d+?)$/;
    const match = time.match(parser);
    if (match) {
        const formatObj: any = new Intl.DateTimeFormat(locale).formatToParts(new Date());
        const first = formatObj[Object.keys(formatObj)[0]].type;
        const month = first === 'month' ? 1 : 2;
        const day = month === 1 ? 2 : 1;
        return new Date(
            parseInt(match[3]),         // year
            parseInt(match[month]) - 1, // monthIndex
            parseInt(match[day]),       // day
            parseInt(match[4]),         // hours
            parseInt(match[5]),         // minutes
            parseInt(match[6]),         // seconds
            parseInt(match[7])          // millis
        );
    }
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
 * Return the trailing comment portion of a line. Only works with no
 * embedded comment tokens (in string content, etc).
 */
export function lineComment(line: string, token = '#'): string | undefined {
    const hash = line.indexOf(token);
    if (hash >= 0 && hash < line.length - 1) {
        return line.substr(hash + 1).trim();
    }
}

/**
 * substitute a forward slash for all backslashes
 */
export function fwdSlashes(path: string): string {
    return path.replace(/\\/g, '/');
}

export function fixEol(path: string): string {
    return path.replace(/\r/g, '');
}

export function header(headers: { [key: string]: string }, name: string): [string, string] | undefined {
    const key = name.toLowerCase();
    const match = Object.keys(headers).find(h => h.toLowerCase() === key);
    if (match) return [match, headers[match]];
}

let cachedPlyVersion = '';
export function plyVersion(): Promise<string> {
    return new Promise((resolve, reject) => {
        if (cachedPlyVersion) {
            resolve(cachedPlyVersion);
        } else {
            try {
                const plyDir = `${process.cwd()}/node_modules/@ply-ct/ply`;
                if (fs.existsSync(`${plyDir}/package.json`)) {
                    fs.promises.readFile(`${plyDir}/package.json`, { encoding: 'utf-8' })
                    .then(contents => {
                        cachedPlyVersion = JSON.parse(contents).version;
                        resolve(cachedPlyVersion);
                    });
                } else if (fs.existsSync(`${process.cwd()}/package.json`)) {
                    fs.promises.readFile(`${process.cwd()}/package.json`, { encoding: 'utf-8' })
                    .then(contents => {
                        const pkgJson = JSON.parse(contents);
                        if (pkgJson.name === '@ply-ct/ply') {
                            cachedPlyVersion = pkgJson.version;
                            resolve(cachedPlyVersion);
                        } else {
                            resolve('unknown');
                        }
                    });
                } else {
                    resolve('unknown');
                }
            } catch (err) {
                reject(err);
            }
        }
    });
}
