import * as os from 'os';
import { TestType, Test, PlyTest } from './test';
import { Result } from './result';
import { Runtime, DecoratedSuite } from './runtime';
import * as yaml from './yaml';
import './date';

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
     * @param className? className for decorated suites
     */
    constructor(
        readonly name: string,
        readonly type: TestType,
        readonly path: string,
        private readonly runtime: Runtime,
        readonly startLine: number = 0,
        readonly endLine: number,
        readonly className?: string
    ) {}

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
            return await this.runTests(this.all(), namesOrValues);
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
            return await this.runTests(tests, values || {});
        }
    }

    /**
     * Tests are run sequentially.
     * @param tests
     */
    private async runTests(tests: T[], values: object): Promise<Result> {
        this.runtime.values = values;
        this.runtime.actual.remove();

        if (this.className) {
            // initialize the decorated suite
            const testFile = this.runtime.testsLocation.toString() + '/' + this.runtime.suitePath;
            const mod = await import(testFile);
            const clsName = Object.keys(mod).find(key => key === this.className);
            if (!clsName) {
                throw new Error(`Suite class ${this.className} not found in ${testFile}`);
            }

            const inst = new mod[clsName]();
            this.runtime.decoratedSuite = new DecoratedSuite(inst);
        }

        let result = new Result();
        let callingCase = await this.getCallingCaseFile();
        // tests are run sequentially
        for (const test of tests) {
            result = await (test as unknown as PlyTest).invoke(this.runtime);
            if (test.type === 'request') {
                this.runtime.actual.append(this.buildResultYaml(result));
            }
        }

        // TODO accumulate result
        // TODO compare actual vs expected
        return result;
    }

    private async getCallingCaseFile(): Promise<string | undefined> {
        const stacktracey = 'stacktracey';
        const StackTracey = await import(stacktracey);
        const stack = new StackTracey();
        for (const item of stack) {
            if (item.callee === 'PlyCase.invoke') {
                return '';
            }
        }
        return '';
    }

    private buildResultYaml(result: Result): string {


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
