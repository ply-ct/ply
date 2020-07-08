import { Options } from './options';
import * as stringify from 'json-stable-stringify';

export interface Status {
    code: number;
    message: string;
}

export interface Response {
    status: Status;
    headers: any;
    body?: any;
    time?: number;
}

export class PlyResponse implements Response {

    constructor(
        readonly status: Status,
        readonly headers: any,
        readonly body?: any,
        readonly time?: number) {
    }

    /**
     * Strips ignored headers and orders body object keys unless suppressed.
     */
    getResponse(options: Options, stringBody = true): PlyResponse {
        const headerNames = Object.keys(this.headers).sort();
        const wanted = options.responseHeaders || headerNames;
        const headers: any = {};
        wanted.forEach(name => {
            headers[name.toLowerCase()] = this.headers[name];
        });

        let body = this.body;
        if (typeof body === 'string' && body.startsWith('{')) {
            try {
                body = JSON.parse(body);
            } catch (err) {
                // cannot parse -- body remains string
            }
        }
        if (stringBody && typeof body === 'object') {
            if (options.responseBodySortedKeys) {
                body = stringify(body, { space: ''.padStart(options.prettyIndent || 0, ' ') });
            }
            else {
                body = JSON.stringify(body, null, options.prettyIndent);
            }
        }

        return new PlyResponse(
            this.status,
            headers,
            body,
            this.time
        );
    }
}