import { TestType, Test } from './test';
import { Response } from './response';
import { Result } from './result';
import { Runtime } from './runtime';
import * as subst from './subst';
import { Writer } from './requests';

export interface Request extends Test {
    url: string;
    method: string;
    headers: object;
    body: string | undefined;

    submit(values: object): Promise<Response>;
}

export class PlyRequest implements Request {
    type = 'request' as TestType;
    url: string;
    method: string;
    headers: any;
    body: string | undefined;
    startLine?: number;
    endLine?: number;

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
        return this.doSubmit(this.toObject(values));
    }

    private async doSubmit(requestObj: Request) {
        const before = new Date().getTime();
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { url, ...fetchRequest } = requestObj;
        const response = await this.fetch(requestObj.url, fetchRequest);
        const status = { code: response.status, message: response.statusText };
        const headers = this.responseHeaders(response.headers);
        const body = await response.text();
        const time = new Date().getTime() - before;
        return new Response(status, headers, body, time);
    }

    /**
     * Request object with substituted values
     */
    private toObject(values?: object): Request {
        const url = subst.replace(this.url, values);
        if (!url.startsWith('http://') && !url.startsWith('https://')) {
            throw new Error('Invalid url: ' + url);
        }
        const method = subst.replace(this.method, values);
        if (!this.isSupportedMethod(method)) {
            throw new Error('Unsupported method: ' + method);
        }
        const headers: any = {};
        Object.keys(this.headers).forEach(name => {
            headers[name] = subst.replace(this.headers[name], values);
        });
        const body = this.body ? subst.replace(this.body, values) : undefined;
        const noImpl = () => { throw new Error('Not implemented'); };
        return {
            name: this.name,
            url,
            method,
            headers,
            body,
            run: noImpl,
            submit: noImpl
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
     * Runs, writes actual results, and verifies vs expected results.
     * @returns result object with success, failure or error
     */
    async run(runtime: Runtime, values: object): Promise<Result> {
        const requestObj = this.toObject(values);
        runtime.logger.debug('Request:', requestObj);
        runtime.actual.remove();
        const response = this.submit(values);
        const output: any = {};
        output[this.name] = {
            request: this.toObject(),
            response
        };
        runtime.actual.write(this.name);
        const writer = new Writer(runtime.options);
        runtime.actual.write(writer.requestYaml(this));

        runtime.logger.debug('Response:', response);
        //runtime.actual.write(writer.responseYaml(response));

        return new Result();

    }
}
