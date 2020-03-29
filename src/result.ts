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
    ) {

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

    outcomesObject(name?: string): object {
        const outcomesObject: any = {};
        for (const outcome of this.outcomes) {
            outcomesObject[outcome.name] = {
                request: outcome.request,
                response: outcome.response
            };
        }
        if (name) {
            const namedObject: any = {};
            namedObject[name] = outcomesObject;
            return namedObject;
        }
        else {
            return outcomesObject;
        }
    }
}
