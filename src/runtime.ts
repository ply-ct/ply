import * as path from 'path';
import * as process from 'process';
import * as minimatch from 'minimatch';
import { Location } from './location';
import { Retrieval } from './retrieval';
import { Storage } from './storage';
import { PlyOptions } from './options';
import { TEST, BEFORE, AFTER, SUITE } from './names';
import { TestSuite, TestCase, Before, After } from './decorators';
import * as yaml from './yaml';
import { lines } from './util';

export class ResultPaths {

    private constructor(
        readonly expected: Retrieval,
        readonly actual: Storage,
        readonly log?: Storage) { }

    /**
     * Figures out locations and file extensions for results.
     * Result file path relative to configured result location is the same as retrieval relative
     * to configured tests location.
     */
    static async create(options: PlyOptions, suiteName: string, retrieval: Retrieval): Promise<ResultPaths> {

        let expectedPath;
        let actualPath;
        let log;

        if (options.resultFollowsRelativePath && retrieval.location.isChildOf(options.testsLocation)) {
            const relPath = retrieval.location.relativeTo(options.testsLocation);
            const resultFilePath = new Location(relPath).parent + '/' + suiteName;
            expectedPath = options.expectedLocation + '/' + resultFilePath;
            actualPath = options.actualLocation + '/' + resultFilePath;
            if (options.logLocation) {
                log = new Storage(options.logLocation + '/' + resultFilePath + '.log');
            }
        }
        else {
            // flatly use the specified path
            expectedPath = options.expectedLocation + '/' + suiteName;
            actualPath = options.actualLocation + '/' + suiteName;
            if (options.logLocation) {
                log = new Storage(options.logLocation + '/' + suiteName + '.log');
            }
        }

        let ext = '.yml';
        if (!await new Retrieval(expectedPath + '.yml').exists) {
            if ((await new Retrieval(expectedPath + '.yaml').exists) || retrieval.location.ext === 'yaml') {
                ext = '.yaml';
            }
        }
        const expected = new Retrieval(expectedPath + ext);
        const actual = new Storage(actualPath + ext);
        return new ResultPaths(expected, actual, log);
    }

    /**
     * Newlines are always \n.
     */
    async getExpectedYaml(name: string): Promise<string> {
        const expected = await this.expected.read();
        if (!expected) {
            throw new Error(`Expected result file not found: ${this.expected}`);
        }
        const expectedObj = yaml.load(this.expected.toString(), expected, true)[name];
        if (!expectedObj) {
            throw new Error(`Expected result not found: ${this.expected}#${name}`);
        }
        const expectedLines = lines(expected);
        return expectedLines.slice(expectedObj.__start, expectedObj.__end + 1).join('\n');
    }

    /**
     * Newlines are always \n.  Trailing \n is appended.
     */
    getActualYaml(name: string): string {
        const actual = this.actual.read();
        if (!actual) {
            throw new Error(`Actual result file not found: ${this.actual}`);
        }
        const actualObj = yaml.load(this.actual.toString(), actual, true)[name];
        if (!actualObj) {
            throw new Error(`Actual result not found: ${this.actual}#${name}`);
        }
        const actualLines = lines(actual);
        return actualLines.slice(actualObj.__start, actualObj.__end + 1).join('\n') + '\n';
    }
}

export type CallingCaseInfo = {
    results: ResultPaths,
    suiteName: string,
    caseName: string
};

export interface RunOptions {
    /**
     * How to handle missing expected result file(s).
     */
    noExpectedResult?: NoExpectedResultDispensation
    /**
     * Import case suite modules from generated .js instead of .ts source (default = false).
     * This runOption needs to be set in your case's calls to Suite.run (for requests),
     * and also in originating the call to Suite.run (for the case(s)).
     */
    importCaseModulesFromBuilt?: boolean
}

export enum NoExpectedResultDispensation {
    /**
     * Proceed and verify (let test fail).
     * This is the default behavior if not specified.
     */
    Proceed = 1,
    /**
     * Run test requests but don't verify outcomes.
     */
    NoVerify = 2,
    /**
     * Create expected from actual and verify based on that.
     */
    CreateExpected = 3
}

/**
 * Runtime information for a test suite.
 */
export class Runtime {

    testsLocation: Location;

    decoratedSuite?: DecoratedSuite;
    values: object = {};
    /**
     * Verified response header names.
     */
    responseHeaders: string[] | undefined;

    constructor(
        readonly locale: string,
        readonly options: PlyOptions,
        readonly retrieval: Retrieval,
        public results: ResultPaths) {

        if (path.isAbsolute(this.options.testsLocation)) {
            this.testsLocation = new Location(this.options.testsLocation);
        }
        else {
            this.testsLocation = new Location(path.resolve(process.cwd() + '/' + this.options.testsLocation));
        }
    }

    get suitePath(): string {
        return this.retrieval.location.relativeTo(this.options.testsLocation);
    }
}

/**
 * Applicable for Cases (and soon Workflows)
 */
export class DecoratedSuite {

    readonly testSuite: TestSuite;
    readonly testCases: TestCase[] = [];
    readonly befores: Before[] = [];
    readonly afters: After[] = [];

    /**
     * @param instance runtime instance of a suite
     */
    constructor(readonly instance: any) {
        this.testSuite = instance.constructor[SUITE];
        if (this.testSuite) {
            this.testSuite = { ...this.testSuite, className: this.testSuite.name };
        }
        Object.getOwnPropertyNames(instance.constructor.prototype).forEach(propName => {
            try {
                if (typeof instance.constructor.prototype[propName] === 'function') {
                    const method = instance.constructor.prototype[propName];
                    if (method[TEST]) {
                        const testCase = method[TEST];
                        if (!this.testCases.find(tc => tc.name === testCase.name)) {
                            this.testCases.push({ ...testCase, method });
                        }
                    }
                    if (method[BEFORE]) {
                        const before = method[BEFORE];
                        if (!this.befores.find(b => b.name === before.name)) {
                            this.befores.push({ ...before, method });
                        }
                    }
                    if (method[AFTER]) {
                        const after = method[AFTER];
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

    private async runIfMatch(beforeOrAfter: Before | After, test: string, values: object) {
        if (this.isMatch(beforeOrAfter, test)) {
            if (beforeOrAfter.tests || !beforeOrAfter.hasRun) {
                await beforeOrAfter.method.call(this.instance, values);
                beforeOrAfter.hasRun = true;
            }
        }
    }

    private isMatch(beforeOrAfter: Before | After, test: string) {
        return !beforeOrAfter.tests || minimatch(test, beforeOrAfter.tests);
    }

    async runBefores(test: string, values: object) {
        for (const before of this.befores) {
            await this.runIfMatch(before, test, values);
        }
    }

    async runAfters(test: string, values: object) {
        for (const after of this.afters) {
            await this.runIfMatch(after, test, values);
        }
    }
}