import { Options } from './options';
import * as stringify from 'json-stable-stringify';

export interface Status {
    code: number;
    message: string;
}

export interface Response {
    status: Status;
    headers: any;
    body?: string;
    time?: number;
}

export class PlyResponse implements Response {

    constructor(
        readonly status: Status,
        readonly headers: any,
        readonly body?: string,
        readonly time?: number) {
    }

    /**
     * Strips ignored headers and orders body object keys unless suppressed.
     */
    getResponse(options: Options): Response {
        const headerNames = Object.keys(this.headers).sort();
        const wanted = options.responseHeaders || headerNames;
        const headers: any = {};
        wanted.forEach(name => {
            headers[name.toLowerCase()] = this.headers[name];
        });

        let body = this.body;
        if (body && options.formatResponseBody && body.startsWith('{')) {
            body = stringify(JSON.parse(body), { space: ''.padStart(options.prettyIndent || 0, ' ') });
        }

        return {
            status: this.status,
            headers,
            body,
            time: this.time
        };
    }
}