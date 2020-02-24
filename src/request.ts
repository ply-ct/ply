import { TestType, Plyable } from './ply';
import { Suite } from './suite';

export class Request implements Plyable {
    type = 'request' as TestType;
    line = 0;

    url: string;
    method: string;
    headers: object | undefined;
    body: string | undefined;

    constructor(readonly suite: Suite<Plyable>, readonly name: string, obj: object) {
    }

}