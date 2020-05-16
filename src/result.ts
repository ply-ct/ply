import { Request } from './request';
import { Response } from './response';

export interface Outcome {
    /**
     * Status of test execution
     */
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

export interface Result extends Outcome {
    /**
     * Request name
     */
    readonly name: string,
    /**
     * Request with runtime substitutions, minus Authorization header
     */
    readonly request: Request,
    /**
     * Response with ignore headers removed, and formatted/sorted body content (per options)
     */
    readonly response: Response
}

export class PlyResult implements Result {

    status: 'Pending' | 'Passed' | 'Failed' | 'Errored' = 'Pending';
    message: string = '';
    line: number = 0;
    diff?: string;

    request: Request;
    constructor(readonly name: string, request: Request, readonly response: Response) {
        this.request = { ... request };
        this.request.headers = { };
        Object.keys(request.headers).forEach( key => {
            if (key !== 'Authorization') {
                this.request.headers[key] = request.headers[key];
            }
        });
    }
}
