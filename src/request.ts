import { TestType, Test } from './test';
import { Location } from './location';
import { PlyOptions } from './options';
import { Response } from './response';
import * as subst from './subst';

export class Request implements Test {
    type = 'request' as TestType;

    url: string;
    method: string;
    headers: any;
    body: string | undefined;
    startLine: number;
    endLine?: number;

    /**
     *
     * @param suitePath relative to tests location (forward slashes)
     * @param name test name
     * @param obj object to parse for contents
     */
    constructor(readonly suitePath: string, readonly name: string, obj: any) {

        this.validateObj(obj);

        this.url = obj['url'].trim();
        this.method = obj['method'].toUpperCase().trim();
        this.headers = obj['headers'];
        this.body = obj['body'];
        this.startLine = obj['line'] || 0;
    }

    validateObj(obj: any) {
        if (!obj) {
            throw new Error("'" + this.path + "' -> Request object is required");
        }
        else if (!obj['url'] || (!obj['url'].startsWith('${') && !(new Location(obj['url']).isUrl))) {
            throw new Error("'" + this.path + "' -> Bad request url: " + obj['url']);
        }
        else if (!(typeof (obj['method']) === 'string')) {
            throw new Error("'" + this.path + "' -> Bad request method: " + obj['method']);
        }
    }

    get path() {
        return this.suitePath + '#' + this.name;
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

    async run(options: PlyOptions, values: object): Promise<Response> {

        const url = subst.replace(this.url, values);
        if (!url.startsWith('http://') && !url.startsWith('https://')) {
            throw new Error('Invalid url: ' + url);
        }

        const before = new Date().getTime();
        const response = await this.fetch(url, this.initObj(values));
        const status = { code: response.status, message: response.statusText };
        const headers = this.responseHeaders(response.headers);
        const body = await response.text();
        const time = new Date().getTime() - before;
        return new Response(status, headers, body, time);
    }

    /**
     * Return fetch init object
     */
    private initObj(values: object): object {
        const method = subst.replace(this.method, values);
        if (!this.isSupportedMethod(method)) {
            throw new Error('Unsupported method: ' + method);
        }
        return {
            method,
            headers: this.requestHeaders(values),
            body: this.body ? subst.replace(this.body, values) : undefined
        };
    }

    /**
     * Convert to ES fetch headers, performing substitutions
     */
    private requestHeaders(values: object): any {
        if (this.headers) {
            const obj: any = {};
            Object.keys(this.headers).forEach(name => {
                obj[name] = subst.replace(this.headers[name], values);
            });
            return obj;
        }
    }

    private responseHeaders(headers: Headers): object {
        const obj: any = {};
        headers.forEach((value, name) => {
            obj[name] = value;
        });
        return obj;
    }
}