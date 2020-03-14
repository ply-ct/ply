import { TestType, Test } from './ply';
import { Storage } from './storage';
import { Retrieval } from './retrieval';

interface Tests<T extends Test> {
    [key: string]: T
}

/**
 * A suite represents one ply requests file (.ply.yaml), one ply case file (.ply.ts),
 * or a single folder within a Postman collection (a .postman_collection.json file
 * may have requests at the top level or may have folders).
 *
 * Suites cannot be nested.
 */
export class Suite<T extends Test> {

    readonly tests: Tests<T> = {};

    /**
     * @param name suite name
     * @param type request/case/workflow
     * @param path relative path from tests location (forward slashes)
     * @param retrieval suite retrieval
     * @param expected expected results retrieval
     * @param actual actual results storage
     * @param tests? requests/cases/workflows
     */
    constructor(
        readonly name: string,
        readonly type: TestType,
        readonly path: string,
        readonly retrieval: Retrieval,
        readonly expected: Retrieval,
        readonly actual: Storage,
        readonly line: number = 0,
        tests: T[] = []) {
            for (const test of tests) {
                this.tests[test.name] = test;
            }
    }

    add(test: T) {
        this.tests[test.name] = test;
    }

    get(name: string): T | undefined {
        return this.tests[name];
    }

    getAll(): T[] {
        return Object.values(this.tests);
    }
}

