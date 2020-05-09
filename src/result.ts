import { Request } from './request';
import { Response } from './response';

/**
 * Request/response couplet from a single submit.
 */
export class Invocation {

    constructor(
        /**
         * request name
         */
        readonly name: string,
        /**
         * request with runtime substitutions
         */
        readonly request: Request,
        /**
         * response with ignore headers removed, and formatted/sorted body content
         */
        readonly response: Response
    ) { }
}

export interface Result {
    status: 'Pending' | 'Passed' | 'Failed' | 'Errored'
    message: string
    /**
     * One-based, relative to starting line of test
     */
    line: number
    /**
     * Diff message
     */
    diff?: string
}

export class PlyResult implements Result {

    status: 'Pending' | 'Passed' | 'Failed' | 'Errored' = 'Pending';
    message: string = '';
    line: number = 0;
    diff?: string;

    constructor(readonly invocation: Invocation) {}

    getResult(): object {
        return {
            status: this.status,
            message: this.message
        };
    }

    getInvocation(): object {
        const { name: _name, type: _type, submitted: _submitted, ...leanRequest } = this.invocation.request;
        delete (leanRequest.headers as any).Authorization;
        const { time: _time, ...leanResponse } = this.invocation.response;
        return {
            [this.invocation.name]: {
                request: leanRequest,
                response: leanResponse
            }
        };
    }
}
