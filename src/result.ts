import { Request } from './request';
import { Response } from './response';

/**
 * Outcome from submitting a single request
 */
export class Outcome {

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

    outcomeObject(): object {
        const { name: _name, type: _type, submitted: _submitted, ...leanRequest } = this.request;
        delete (leanRequest.headers as any).Authorization;
        const { time: _time, ...leanResponse } = this.response;
        return {
            request: leanRequest,
            response: leanResponse
        };
    }
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

    readonly outcomes: Outcome[] = [];

    resultObject(): object {
        return {
            status: this.status,
            message: this.message
        };
    }
}
