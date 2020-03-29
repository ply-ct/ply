import { TestType, Test } from './test';
import { Result } from './result';
import { Runtime } from './runtime';
import * as yaml from './yaml';

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
     * @param runtime info
     * @param retrieval suite retrieval
     * @param expected expected results retrieval
     * @param actual actual results storage
     * @param tests? requests/cases/workflows
     */
    constructor(
        readonly name: string,
        readonly type: TestType,
        readonly path: string,
        readonly runtime: Runtime,
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

    all(): T[] {
        return Object.values(this.tests);
    }

    /**
     * Run test(s), write request/response to actual results, and verify vs expected.
     * @param values runtime values for substitution
     * @returns result indicating outcome
     */
    async run(values: object): Promise<Result>;
    async run(name: string, values: object): Promise<Result>;
    async run(nameOrValues: object | string, values?: object): Promise<Result> {
        if (typeof nameOrValues === 'object') {
            this.runtime.values = nameOrValues;
            this.runtime.actual.remove();
            // tests are run sequentially
            for (const test of this.all()) {
                const result = await this.runTest(test);


            }
            // TODO accumulate result
            return new Result();
        }
        else {
            this.runtime.values = values as object;
            const test = this.get(name);
            if (!test) {
                throw new Error(`Test not found: ${name}`);
            }
            this.runtime.actual.remove();
            const result = this.runTest(test);
            return result;
        }
    }

    private async runTest(test: T): Promise<Result> {
        const result = await test.run(this.runtime);
        this.runtime.actual.append(yaml.dump(result.outcomesObject, this.runtime.options.prettyIndent));
        // TODO compare actual vs expected
        return result;
    }

}

