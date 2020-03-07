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

    /**
     *
     * @param type request/case/workflow
     * @param path relative path from tests location (forward slashes)
     * @param retrieval suite retrieval
     * @param children requests/cases/workflows
     * @param expected expected results retrieval
     * @param actual actual results storage
     */
    constructor(readonly type: TestType,
        readonly path: string,
        readonly retrieval: Retrieval,
        readonly children: Map<string,T>,
        readonly expected: Retrieval,
        readonly actual: Storage) {
    }
}

