import { TestType, Plyable } from './ply';
import { Storage } from './storage';
import { Retrieval } from './retrieval';

/**
 * A suite represents one ply requests file (.ply.yaml), one ply case file (.ply.ts),
 * or a single folder within a Postman collection (a .postman_collection.json file
 * may have requests at the top level or may have folders).
 *
 * Suites cannot be nested.
 */
export class Suite<T extends Plyable> {

    constructor(readonly type: TestType,
        readonly name: string,
        readonly retrieval: Retrieval,
        readonly children: Map<string,T>,
        readonly expected: Retrieval,
        readonly actual: Storage) {
    }
}

