import { safeEval } from 'flowbee';
import stringify from 'json-stable-stringify';
import { Options } from './options';
import { fixEol, isBinary, uintArrayToString } from './util';

export interface Status {
    code: number;
    message: string;
}

export interface Response {
    status: Status;
    headers: { [key: string]: string };
    /**
     * Body can be text, object, ArrayBuffer, or undefined.
     */
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
     * Orders body object keys unless suppressed by options.
     * Sorts arrays if...
     * Does not substitute values.
     * Response header keys are always lowercase.
     * Binary response body is rendered as text.
     * @param runId
     * @param options
     * @param wantedHeaders optional name of headers subset to keep
     * @param stringBody body object is stringified (windows eols are replaced if prettyIndent)
     */
    getResponse(
        runId: string,
        options: Options,
        massagers?: ResponseMassagers,
        stringBody = false
    ): PlyResponse {
        const headers: { [key: string]: string } = {};
        const headerNames = massagers?.headers || Object.keys(this.headers);
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

        if (isBinary(this.headers, options)) {
            if (body) {
                body = uintArrayToString(new Uint8Array(body));
            }
        } else if (typeof body === 'object' && massagers?.arraySorts) {
            for (const expr of Object.keys(massagers.arraySorts)) {
                if (expr === '${response.body}' || expr.startsWith('${response.body.')) {
                    const arr = safeEval(expr, { response: { body } });
                    if (Array.isArray(arr)) {
                        const prop = massagers.arraySorts[expr];
                        arr.sort((a1, a2) => {
                            const v1 = a1[prop];
                            const v2 = a2[prop];
                            if (v1 === undefined && v2 !== undefined) return -1;
                            if (v2 === undefined && v1 !== undefined) return 1;
                            if (typeof v1 === 'number' && typeof v2 === 'number') return v1 - v2;
                            return ('' + v1).localeCompare('' + v2);
                        });
                    }
                }
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

export interface ResponseMassagers {
    headers?: string[];
    arraySorts?: { [expr: string]: string };
}
