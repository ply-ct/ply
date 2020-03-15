// TODO temp retain API for vscode-ply
import { Request } from './request';

export interface Status {
    code: number;
    message: string;
}

export interface Response {
    /**
     * Response time in ms.
     */
    time: number;
    status: Status;
    headers: object | undefined;
    body: string | undefined;
}

export interface Result {
    status: 'Passed' | 'Failed' | 'Errored';
    message: string;
}

/**
 * Event type is 'start' or 'outcome'.
 * Event id is the request id or case id.
 */
export interface PlyEvent {
    type: string;
    id: string;
    request: Request | undefined;
    response: Response | undefined;
    result: Result | undefined;
    error: Error | undefined;
}
