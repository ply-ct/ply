import { TestType, Plyable } from './ply';

export class Request implements Plyable {
    type = 'request' as TestType;
    line = 0;

    url: string;
    method: string;
    headers: any;
    body: string | undefined;

    /**
     *
     * @param suite suite path relative to tests location (forward slashes)
     * @param name test name
     * @param obj object to parse for contents
     */
    constructor(readonly suite: string, readonly name: string, obj: any) {
        this.url = obj['url'];
        this.method = obj['method'];
        this.headers = obj['headers'];
        this.body = obj['body'];
        this.line = obj['line'];
    }
}