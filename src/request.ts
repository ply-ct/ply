import { TestType, Test, PlyTest } from './test';
import { Response, PlyResponse } from './response';
import { Logger } from './logger';
import { Retrieval } from './retrieval';
import { Runtime } from './runtime';
import { PlyResult } from './result';
import * as subst from './subst';
import './date';

export interface Request extends Test {
    url: string;
    method: string;
    headers: any;
    body: string | undefined;
    submitted?: Date;
    submit(values: object): Promise<Response>;
}

export class PlyRequest implements Request, PlyTest {
    type = 'request' as TestType;
    url: string;
    method: string;
    headers: any;
    body: string | undefined;
    start?: number;
    end?: number;
    submitted?: Date;

    /**
     * @param name test name
     * @param obj object to parse for contents
     */
    constructor(readonly name: string, obj: Request, readonly logger: Logger, retrieval: Retrieval) {
        if (!obj.url) {
            throw new Error(`Request ${name} in ${retrieval} is missing 'url'`);
        }
        this.url = obj.url.trim();
        if (!obj.method) {
            throw new Error(`Request ${name} in ${retrieval} is missing 'method'`);
        }
        this.method = obj.method.trim();
        this.headers = obj.headers || {};
        this.body = obj.body;
        this.start = obj.start || 0;
        this.end = obj.end;
    }

    getSupportedMethod(method: string): string | undefined {
        const upperCase = method.toUpperCase().trim();
        if (upperCase === 'GET'
              || upperCase === 'HEAD'
              || upperCase === 'POST'
              || upperCase === 'PUT'
              || upperCase === 'DELETE'
              || upperCase === 'CONNECT'
              || upperCase === 'OPTIONS'
              || upperCase === 'TRACE'
              || upperCase === 'PATCH') {
            return upperCase;
        }
    }

    get fetch(): any {
        if (typeof window === 'undefined') {
            return require('node-fetch');
        }
        else {
            return window.fetch;
        }
    }

    /**
     * Call submit() to send the request without producing actual results
     * or comparing with expected.  Useful for cleaning up or restoring
     * REST resources before/after testing (see Case.before()/after()).
     * @param values
     */
    async submit(values: object): Promise<Response> {
        return await this.doSubmit(this.getRequest(values));
    }

    private async doSubmit(requestObj: Request): Promise<PlyResponse> {
        const before = new Date().getTime();
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { url, ...fetchRequest } = requestObj;
        if (this.headers.Authorization) {
            (fetchRequest.headers as any).Authorization = this.headers.Authorization;
        }
        const response = await this.fetch(requestObj.url, fetchRequest);
        const status = { code: response.status, message: response.statusText };
        const headers = this.responseHeaders(response.headers);
        const body = await response.text();
        const time = new Date().getTime() - before;
        return new PlyResponse(status, headers, body, time);
    }

    /**
     * Request object with substituted values
     */
    private getRequest(values: object): Request {
        const url = subst.replace(this.url, values, this.logger);
        if (!url.startsWith('http://') && !url.startsWith('https://')) {
            throw new Error('Invalid url: ' + url);
        }
        const method = subst.replace(this.method, values, this.logger).toUpperCase();
        if (!this.getSupportedMethod(method)) {
            throw new Error('Unsupported method: ' + method);
        }
        const { Authorization: _auth, ...headers } = this.headers;
        return {
            name: this.name,
            type: this.type,
            url,
            method,
            headers,
            body: this.body ? subst.replace(this.body, values, this.logger) : undefined,
            submitted: this.submitted,
            submit: () => { throw new Error('Not implemented'); }
         };
    }

    private responseHeaders(headers: Headers): object {
        const obj: any = {};
        headers.forEach((value, name) => {
            obj[name] = value;
        });
        return obj;
    }

    /**
     * Only to be called in the context of a Suite (hence 'runtime').
     * To execute a test programmatically, call one of the Suite.run() overloads.
     * Or to send a request without testing, call submit().
     * @returns result with request invocation and status of 'Pending'
     */
    async run(runtime: Runtime): Promise<PlyResult> {
        this.submitted = new Date();
        this.logger.info(`Request '${this.name}' submitted at ${this.submitted.timestamp(runtime.locale)}`);
        const requestObject = this.getRequest(runtime.values);
        this.logger.debug('Request:', requestObject);
        const response = await this.doSubmit(requestObject);
        this.logger.debug('Response:', response);
        const result = new PlyResult(
            this.name,
            requestObject,
            response.getResponse(runtime.options)
        );
        return result;
    }
}