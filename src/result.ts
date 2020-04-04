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
        const { name: _name, submitted: _submitted, ...leanRequest } = this.request;
        const { time: _time, ...leanResponse } = this.response;
        return {
            request: leanRequest,
            response: leanResponse
        };
    }
}

export class Result {

    status: 'Pending' | 'Passed' | 'Failed' | 'Errored' = 'Pending';
    message?: string;

    readonly outcomes: Outcome[] = [];

    resultObject(): object {
        return {
            status: this.status,
            message: this.message
        };
    }
}
