import * as os from 'os';
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
    async runTests(tests: T[], values: object): Promise<Result> {
        this.runtime.values = values;
        this.runtime.actual.remove();

        let result = new Result();
        // tests are run sequentially
        for (const test of tests) {
            result = await test.run(this.runtime);
            this.runtime.actual.append(this.buildResultYaml(result));
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
                    let submitted = outcome?.request.submitted;
                    let millis = String(submitted.getMilliseconds()).padStart(3, '0');
                    let stamp = `${submitted.toLocaleString(this.runtime.locale, { hour12: false })}:${millis}`;
                    ymlLines[outcomeLine] += `  # ${stamp}`;
                }
                if (typeof outcome?.response.time !== 'undefined') {
                    let responseMs = outcome.response.time + ' ms';
                    let requestYml = yaml.dump({ request: outcomeObject.request }, this.runtime.options.prettyIndent);
                    ymlLines[outcomeLine + requestYml.split('\n').length] += ` # ${responseMs}`;
                }
            }
        });
        yml = ymlLines.join(os.EOL);

        return yml;
    }
}

