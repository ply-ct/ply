import { Options } from './options';

export interface Status {
    code: number;
    message: string;
}

export interface Response {
    status: Status;
    headers: any;
    body?: string;
}

export class PlyResponse implements Response {

    constructor(
        readonly status: Status,
        readonly headers: any,
        readonly body?: string,
        readonly time?: number) {
    }

    /**
     * Strips ignored headers and orders body object keys.
     */
    responseObject(options: Options): Response {
        const headerNames = Object.keys(this.headers).sort();
        const wanted = options.responseHeaders || headerNames;
        const headers: any = {};
        wanted.forEach(name => {
            headers[name.toLowerCase()] = this.headers[name];
        });

        let body = this.body;
        if (body && options.formatResponseBody && body.startsWith('{')) {
            body = JSON.stringify(JSON.parse(body), this.replacer, options.prettyIndent);

        }

        return {
            status: this.status,
            headers,
            body
        };
    }

    /**
     * TODO ordering of keys
     */
    replacer(key: string, value: any): any {
        return value;
    }

}