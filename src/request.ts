import { TestType, Test } from './test';
import { Response, PlyResponse } from './response';
import { Runtime } from './runtime';
import { Result, Outcome } from './result';
import * as subst from './subst';
import './date';

export interface Request extends Test {
    url: string;
    method: string;
    headers: object;
    body: string | undefined;
    submitted?: Date;
}

export class PlyRequest implements Request {
    type = 'request' as TestType;
    url: string;
    method: string;
    headers: any;
    body: string | undefined;
    startLine?: number;
    endLine?: number;
    submitted?: Date;

    /**
     * @param name test name
     * @param obj object to parse for contents
     */
    constructor(readonly name: string, obj: Request) {
        this.url = obj['url'].trim();
        this.method = obj['method'].toUpperCase().trim();
        this.headers = obj['headers'] || {};
        this.body = obj['body'];
        this.startLine = obj['startLine'] || 0;
    }

    isSupportedMethod(method: string): boolean {
        const upperCase = method.toUpperCase().trim();
        return (upperCase.startsWith('${') && upperCase.endsWith('}'))
            || upperCase === 'GET'
            || upperCase === 'HEAD'
            || upperCase === 'POST'
            || upperCase === 'PUT'
            || upperCase === 'DELETE'
            || upperCase === 'CONNECT'
            || upperCase === 'OPTIONS'
            || upperCase === 'TRACE'
            || upperCase === 'PATCH';
    }

    get fetch(): any {
        if (typeof window === 'undefined') {
            return require('node-fetch');
        }
        else {
            return window.fetch;
        }
    }

    async submit(values: object): Promise<Response> {
        return this.doSubmit(this.requestObject(values));
    }

    private async doSubmit(requestObj: Request) {
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
    private requestObject(values?: object): Request {
        const url = subst.replace(this.url, values);
        if (!url.startsWith('http://') && !url.startsWith('https://')) {
            throw new Error('Invalid url: ' + url);
        }
        const method = subst.replace(this.method, values);
        if (!this.isSupportedMethod(method)) {
            throw new Error('Unsupported method: ' + method);
        }
        const { Authorization: _auth, ...headers } = this.headers;
        return {
            name: this.name,
            type: this.type,
            url,
            method,
            headers,
            body: this.body ? subst.replace(this.body, values) : undefined,
            submitted: this.submitted,
            run: () => { throw new Error('Not implemented'); }
         };
    }

    private responseHeaders(headers: Headers): object {
        const obj: any = {};
        headers.forEach((value, name) => {
            obj[name] = value;
        });
        return obj;
    }

    async run(runtime: Runtime): Promise<Result> {
        this.submitted = new Date();
        runtime.logger.info(`Request '${this.name}' submitted at ${this.submitted.timestamp(runtime.locale)}`);
        const requestObject = this.requestObject(runtime.values);
        runtime.logger.debug('Request:', requestObject);
        const response = await this.doSubmit(requestObject);
        runtime.logger.debug('Response:', response);
        const result = new Result();
        const outcome = new Outcome(
            this.name,
            requestObject,
            response.responseObject(runtime.options)
        );
        result.outcomes.push(outcome);
        return result;
    }
}