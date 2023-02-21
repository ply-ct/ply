import { Options } from './options';
import stringify from 'json-stable-stringify';
import { fixEol } from './util';

export interface Status {
    code: number;
    message: string;
}

export interface Response {
    status: Status;
    headers: { [key: string]: string };
    body?: any;
    submitted?: Date;
    time?: number;
}

export class PlyResponse implements Response {
    constructor(
        readonly runId: string,
        readonly status: Status,
        readonly headers: { [key: string]: string },
        readonly body?: any,
        readonly time?: number
    ) {}

    /**
     * Orders body object keys unless suppressed by options.  Does not substitute values.
     * Response header keys are always lowercase
     * @param runId
     * @param options
     * @param wantedHeaders optional name of headers subset to keep
     * @param stringBody body object is stringified (windows eols are replaced if prettyIndent)
     */
    getResponse(
        runId: string,
        options: Options,
        wantedHeaders?: string[],
        stringBody = false
    ): PlyResponse {
        const headers: any = {};
        const headerNames = wantedHeaders || Object.keys(this.headers);
        headerNames.forEach((h) => {
            headers[h.toLowerCase()] = this.headers[h];
        });

        let body = this.body;
        let isJsonString = false;
        if (typeof body === 'string' && (body.startsWith('{') || body.startsWith('['))) {
            try {
                body = JSON.parse(body);
                isJsonString = true;
            } catch (err) {
                // cannot parse -- body remains string
                if (options.verbose) console.debug(err);
            }
        }
        if (stringBody && typeof body === 'object') {
            if (options.responseBodySortedKeys) {
                body = stringify(body, { space: ''.padStart(options.prettyIndent || 0, ' ') });
            } else {
                body = JSON.stringify(body, null, options.prettyIndent);
            }
        } else if (
            !isJsonString &&
            typeof body === 'string' &&
            body.trim().startsWith('<') &&
            options.prettyIndent
        ) {
            // format XML
            try {
                const xmlOpts = {
                    indentation: ''.padStart(options.prettyIndent, ' '),
                    collapseContent: true
                };
                body = require('xml-formatter')(body, xmlOpts);
            } catch (err) {
                // cannot format
                if (options.verbose) console.debug(err);
            }
        }
        if (body && stringBody && options.prettyIndent) {
            body = fixEol(body);
        }

        return new PlyResponse(runId, this.status, headers, body, this.time);
    }
}
