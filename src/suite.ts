import * as os from 'os';
import { TestType, Test, PlyTest } from './test';
import { Result, PlyResult } from './result';
import { Runtime, DecoratedSuite, ResultPaths } from './runtime';
import { SUITE_PREFIX, TEST_PREFIX } from './decorators';
import { Retrieval } from './retrieval';
import * as yaml from './yaml';
import './date';
import { verify } from './verify';

interface Tests<T extends Test> {
    [key: string]: T
}

type CallingCaseInfo = {
    results: ResultPaths,
    suiteName: string,
    caseName: string
};

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
     * @param type request|case|workflow
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
        /**
         * zero-based start line
         */
        readonly start: number = 0,
        /**
         * zero-based end line
         */
        readonly end: number,
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
    async run(values: object): Promise<Result[]>;
    async run(name: string, values: object): Promise<Result[]>;
    async run(names: string[], values: object): Promise<Result[]>;
    async run(namesOrValues: object | string | string[], values?: object): Promise<Result[]> {
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
    private async runTests(tests: T[], values: object): Promise<Result[]> {
        this.runtime.values = values;

        let callingCaseInfo: CallingCaseInfo | undefined;
        if (this.className) {
            // running a case
            // initialize the decorated suite
            const testFile = this.runtime.testsLocation.toString() + '/' + this.path;
            const mod = await import(testFile);
            const clsName = Object.keys(mod).find(key => key === this.className);
            if (!clsName) {
                throw new Error(`Suite class ${this.className} not found in ${testFile}`);
            }

            const inst = new mod[clsName]();
            this.runtime.decoratedSuite = new DecoratedSuite(inst);
            this.runtime.results.actual.remove();
        }
        else {
            // running a request
            callingCaseInfo = await this.getCallingCaseInfo();
            if (callingCaseInfo) {
                this.runtime.results = callingCaseInfo.results;
            }
            else {
                this.runtime.results.actual.remove();
            }
        }

        let results: Result[] = [];
        // tests are run sequentially
        for (const test of tests) {
            if (test.type === 'case') {
                this.runtime.results.actual.append(test.name + ':' + os.EOL);
            }
            let plyTest = test as unknown as PlyTest;
            let plyResult = await plyTest.invoke(this.runtime);
            if (test.type === 'request') {
                let indent = callingCaseInfo ? this.runtime.options.prettyIndent : 0;
                const actualYaml = this.buildResultYaml(plyResult, indent);
                this.runtime.results.actual.append(actualYaml);
                const expected = await this.runtime.results.expected.read();
                if (!expected) {
                    throw new Error(`Expected result not found: ${this.runtime.results.expected}`);
                }
                let result: Result = { status: 'Passed', message: 'Test succeeded', line: 0 };
                // const expectedYaml = yaml.load(this.runtime.results.expected.toString(), expected, true);
                // this.runtime.logger.debug(`Comparing: ${expectedYaml}\n  with: ${actualYaml}`);

                // let result = await verify(expectedYaml, actualYaml, values);
                // if (result.status === 'Passed') {
                //     this.runtime.logger.info(`Test ${test.name} PASSED`);
                // }
                // else {
                //     this.runtime.logger.error(`Test ${test.name} FAILED: Results differ from line ${result.line}`, result.diff);
                // }

                results.push(result);
            }
        }

        return results;
    }

    /**
     * TODO fragile, needs thorough testing through vscode-ply
     */
    private async getCallingCaseInfo(): Promise<CallingCaseInfo | undefined> {
        const stacktracey = 'stacktracey';
        const StackTracey = await import(stacktracey);
        const stack = new StackTracey();
        const plyCaseInvoke = stack.findIndex((elem: {callee: string;}) => elem.callee === 'PlyCase.invoke');
        if (plyCaseInvoke > 0) {
            const element = stack[plyCaseInvoke - 1];
            const dot = element.callee.indexOf('.');
            if (dot > 0 && dot < element.callee.length - 1) {
                const clsName = element.callee.substring(0, dot);
                const mod = await import(element.file);
                const cls = mod[clsName];
                const suiteName = cls[SUITE_PREFIX].name;
                const mthName = element.callee.substring(dot + 1);
                const mth = cls.prototype[mthName];
                const caseName = mth[TEST_PREFIX].name;
                const results = await ResultPaths.create(this.runtime.options, suiteName, new Retrieval(element.file));
                return { results, suiteName, caseName };
            }
        }
    }

    private buildResultYaml(result: PlyResult, indent: number): string {


        // (see test/ply/results/expected/cases/movie-crud.yaml)

        let outcomesObject: any = {};
        for (const outcome of result.outcomes) {
            outcomesObject[outcome.name] = outcome.outcomeObject();
        }

        let yml = yaml.dump(outcomesObject, this.runtime.options.prettyIndent);

        // parse for line numbers
        const baseName = this.runtime.results.actual.location.base;
        outcomesObject = yaml.load(baseName, yml, true);
        let ymlLines = yml.split('\n');
        if (indent) {
            ymlLines = ymlLines.map((line, i) => {
                if (i < ymlLines.length - 1) {
                    return line.padStart(line.length + indent);
                }
                else {
                    return line;
                }
            });
        }
        Object.keys(outcomesObject).forEach(name => {
            let outcome = result.outcomes.find(o => o.name === name);
            let outcomeObject = outcomesObject[name];
            if (typeof outcomeObject.__start !== 'undefined') {
                let outcomeLine = outcomeObject.__start;
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
