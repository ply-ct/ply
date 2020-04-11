import * as os from 'os';
import { TestType, Test } from './test';
import { Result } from './result';
import { Runtime } from './runtime';
import * as yaml from './yaml';
import './date';
import { TEST_PREFIX, BEFORE_PREFIX, AFTER_PREFIX, SUITE_PREFIX } from './decorators';
import { TestSuite, TestCase, Before, After } from './decorators';

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
        private readonly runtime: Runtime,
        readonly startLine: number = 0,
        readonly endLine: number,
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
    async run(names: string[], values: object): Promise<Result>;
    async run(namesOrValues: object | string | string[], values?: object): Promise<Result> {
        if (typeof namesOrValues === 'object') {
            // run all tests
            return this.runTests(this.all(), namesOrValues);
        }
        else {
            const names = typeof namesOrValues === 'string' ? [namesOrValues] : namesOrValues;
            const tests = names.map(name => {
                let test = this.get(name);
                if (!test) {
                    throw new Error(`Test not found: ${name}`);
                }
                return test;
            }, this);
            return this.runTests(tests, values || {});
        }
    }

    /**
     * Tests are run sequentially.
     * @param tests
     */
    private async runTests(tests: T[], values: object): Promise<Result> {
        this.runtime.values = values;
        this.runtime.actual.remove();

        let result = new Result();
        // tests are run sequentially
        for (const test of tests) {
            result = await test.run(this.runtime);
            if (test.type === 'request') {
                this.runtime.actual.append(this.buildResultYaml(result));
            }
        }

        // TODO accumulate result
        // TODO compare actual vs expected
        return result;
    }

    buildResultYaml(result: Result): string {


        // TODO named outcomesObject == case run
        // (see test/ply/results/expected/cases/movie-crud.yaml)


        let outcomesObject: any = {};
        for (const outcome of result.outcomes) {
            outcomesObject[outcome.name] = outcome.outcomeObject();
        }

        let yml = yaml.dump(outcomesObject, this.runtime.options.prettyIndent);

        // parse for line numbers
        const baseName = this.runtime.actual.location.base;
        outcomesObject = yaml.load(baseName, yml);
        const ymlLines = yml.split('\n');
        Object.keys(outcomesObject).forEach(name => {
            let outcome = result.outcomes.find(o => o.name === name);
            let outcomeObject = outcomesObject[name];
            if (typeof outcomeObject.__line !== 'undefined') {
                let outcomeLine = outcomeObject.__line;
                if (outcome?.request.submitted) {
                    ymlLines[outcomeLine] += `  # ${outcome.request.submitted.timestamp(this.runtime.locale)}`;
                }
                if (typeof outcome?.response.time !== 'undefined') {
                    let responseMs = outcome.response.time + ' ms';
                    let requestYml = yaml.dump({ request: outcomeObject.request }, this.runtime.options.prettyIndent);
                    ymlLines[outcomeLine + requestYml.split('\n').length] += `  # ${responseMs}`;
                }
            }
        });
        yml = ymlLines.join(os.EOL);

        return yml;
    }
}

/**
 * Applicable for Cases (and soon Workflows)
 */
export class DecoratedSuite {

    testSuite: TestSuite;
    testCases: TestCase[] = [];
    befores: Before[] = [];
    afters: After[] = [];

    /**
     * @param instance runtime instance of a suite
     */
    constructor(instance: any) {
        this.testSuite = instance.constructor[SUITE_PREFIX];
        Object.getOwnPropertyNames(instance.constructor.prototype).forEach(propName => {
            try {
                if (typeof instance.constructor.prototype[propName] === 'function') {
                    const method = instance.constructor.prototype[propName];
                    if (method[TEST_PREFIX]) {
                        let testCase = method[TEST_PREFIX];
                        if (!this.testCases.find(tc => tc.name === testCase.name)) {
                            this.testCases.push({ ...testCase, method });
                        }
                    }
                    if (method[BEFORE_PREFIX]) {
                        let before = method[BEFORE_PREFIX];
                        if (!this.befores.find(b => b.name === before.name)) {
                            this.befores.push({ ...before, method });
                        }
                    }
                    if (method[AFTER_PREFIX]) {
                        let after = method[AFTER_PREFIX];
                        if (!this.afters.find(a => a.name === after.name)) {
                            this.afters.push({ ...after, method });
                        }
                    }
                }
            }
            catch (_ignored) {
                // getter or setter before constructor?
            }
        });
    }
}
