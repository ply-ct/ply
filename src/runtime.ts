import * as path from 'path';
import { minimatch } from 'minimatch';
import * as yaml from './yaml';
import * as util from './util';
import { Location } from './location';
import { Retrieval } from './retrieval';
import { PlyOptions } from './options';
import { ResultOptions, ResultPaths } from './result';
import { TEST, BEFORE, AFTER, SUITE } from './names';
import { TestSuite, TestCase, Before, After } from './decorators';
import { ResponseMassagers } from './response';
import { Values } from './values';

/**
 * Runtime information for a test suite.
 */
export class Runtime {
    testsLocation: Location;

    decoratedSuite?: DecoratedSuite;
    /**
     * Verified response header names.
     */
    responseMassagers?: ResponseMassagers;

    constructor(
        readonly options: PlyOptions,
        readonly retrieval: Retrieval,
        public results: ResultPaths
    ) {
        if (path.isAbsolute(this.options.testsLocation)) {
            this.testsLocation = new Location(this.options.testsLocation);
        } else {
            this.testsLocation = new Location(
                path.resolve(process.cwd() + '/' + this.options.testsLocation)
            );
        }
    }

    get suitePath(): string {
        return this.retrieval.location.relativeTo(this.options.testsLocation);
    }

    appendResult(line: string, options: ResultOptions) {
        line = line.padStart(line.length + (options.level || 0) * (this.options.prettyIndent || 0));
        this.results.actual.append(`${line}${options.comment ? '  # ' + options.comment : ''}\n`);
        if (options.withExpected) {
            this.results.expected.append(`${line}\n`);
        }
    }

    updateResult(name: string, line: string, options: ResultOptions) {
        if (options.subflow) {
            // parallel not supported in subflow
            this.appendResult(line, options);
            return;
        }
        line = line.padStart(line.length + (options.level || 0) * (this.options.prettyIndent || 0));
        const actual = yaml.load(
            this.results.actual.location.path,
            this.results.actual.read()!,
            true
        );
        const loc = actual[name].__end;
        this.results.actual.insert(
            `${line}${options.comment ? '  # ' + options.comment : ''}`,
            loc + 1
        );
        if (options.withExpected) {
            this.results.expected.insert(`${line}`, loc + 1);
        }
    }

    /**
     * Take into account comments in expected yaml.
     */
    async padActualStart(name: string, instNum: number) {
        const expectedYaml = await this.results.getExpectedYaml(name, instNum);
        if (expectedYaml.start > 0) {
            const actualYaml = this.results.getActualYaml(name, instNum);
            if (expectedYaml.start > actualYaml.start) {
                const extraExpectedLines = util
                    .lines(expectedYaml.text)
                    .slice(actualYaml.start, expectedYaml.start);
                const extraWhite = extraExpectedLines.filter((line) => {
                    const trimmed = line.trim();
                    return !trimmed.length || trimmed.startsWith('#');
                }).length;
                if (extraWhite) {
                    this.results.actual.padLines(actualYaml.start, extraWhite);
                }
            }
        }
    }
}

export type CallingCaseInfo = {
    results: ResultPaths;
    suiteName: string;
    caseName: string;
};

/**
 * Applicable for Cases
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
        Object.getOwnPropertyNames(instance.constructor.prototype).forEach((propName) => {
            try {
                if (typeof instance.constructor.prototype[propName] === 'function') {
                    const method = instance.constructor.prototype[propName];
                    if (method[TEST]) {
                        const testCase = method[TEST];
                        if (!this.testCases.find((tc) => tc.name === testCase.name)) {
                            this.testCases.push({ ...testCase, method });
                        }
                    }
                    if (method[BEFORE]) {
                        const before = method[BEFORE];
                        if (!this.befores.find((b) => b.name === before.name)) {
                            this.befores.push({ ...before, method });
                        }
                    }
                    if (method[AFTER]) {
                        const after = method[AFTER];
                        if (!this.afters.find((a) => a.name === after.name)) {
                            this.afters.push({ ...after, method });
                        }
                    }
                }
            } catch (_ignored) {
                // getter or setter before constructor?
            }
        });
    }

    private async runIfMatch(beforeOrAfter: Before | After, test: string, values: Values) {
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

    async runBefores(test: string, values: Values) {
        for (const before of this.befores) {
            await this.runIfMatch(before, test, values);
        }
    }

    async runAfters(test: string, values: Values) {
        for (const after of this.afters) {
            await this.runIfMatch(after, test, values);
        }
    }
}
