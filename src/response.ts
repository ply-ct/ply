export interface Status {
    code: number;
    message: string;
}

export class Response {

    constructor(
        readonly status: Status,
        readonly headers: any,
        readonly body: string,
        readonly time: number) {
    }
}