import * as path from 'path';
import { rimraf } from 'rimraf';
import { EventEmitter } from 'events';
import { Options, Config, PlyOptions, RunOptions, Defaults } from './options';
import { Suite } from './suite';
import { Test } from './test';
import { Request } from './request';
import { Case } from './case';
import { CaseLoader } from './cases';
import { RequestLoader } from './requests';
import { Result } from './result';
import { TsCompileOptions } from './compile';
import { Log, LogLevel } from './log';
import { Logger } from './logger';
import * as util from './util';
import { FlowLoader, FlowSuite } from './flows';
import { Values } from './values';
import { PlyRunner } from './runner';
import { ReporterFactory } from './report/report';
import { OverallResults } from './runs/model';

export class Ply {
    readonly options: PlyOptions;

    constructor(options?: Options, private logger?: Log) {
        this.options = Object.assign({}, new Defaults(), options || new Config().options);
    }

    /**
     * Load request from .ply file
     */
    async loadRequest(location: string): Promise<Request> {
        const suite = await this.loadRequestSuite(location);
        if (suite.size() === 0) throw new Error(`No request found in: ${suite.name}`);
        return suite.all()[0];
    }

    loadRequestSync(location: string): Request {
        const suite = this.loadRequestSuiteSync(location);
        if (suite.size() === 0) throw new Error(`No request found in: ${suite.name}`);
        return suite.all()[0];
    }

    /**
     * Load request suites.
     * @param locations can be URLs or file paths
     */
    async loadRequests(location: string): Promise<Suite<Request>[]>;
    async loadRequests(...locations: string[]): Promise<Suite<Request>[]>;
    async loadRequests(locations: string[], ...moreLocations: string[]): Promise<Suite<Request>[]>;
    async loadRequests(
        locations: string | string[],
        ...moreLocations: string[]
    ): Promise<Suite<Request>[]> {
        if (typeof locations === 'string') {
            locations = [locations];
        }
        if (moreLocations) {
            locations = [...locations, ...moreLocations];
        }
        const requestLoader = new RequestLoader(locations, this.options, this.logger);
        return await requestLoader.load();
    }

    /**
     * Throws if location or suite not found
     */
    async loadRequestSuite(location: string): Promise<Suite<Request>> {
        const requestSuites = await this.loadRequests([location]);
        if (requestSuites.length === 0) {
            throw new Error(`No request suite found in: ${location}`);
        }
        return requestSuites[0];
    }

    /**
     * Load request suites.
     * @param locations can be URLs or file paths
     */
    loadRequestsSync(location: string): Suite<Request>[];
    loadRequestsSync(...locations: string[]): Suite<Request>[];
    loadRequestsSync(locations: string[], ...moreLocations: string[]): Suite<Request>[];
    loadRequestsSync(locations: string | string[], ...moreLocations: string[]): Suite<Request>[] {
        if (typeof locations === 'string') {
            locations = [locations];
        }
        if (moreLocations) {
            locations = [...locations, ...moreLocations];
        }
        const requestLoader = new RequestLoader(locations, this.options, this.logger);
        return requestLoader.sync();
    }

    /**
     * Throws if location or suite not found
     */
    loadRequestSuiteSync(location: string): Suite<Request> {
        const requestSuites = this.loadRequestsSync([location]);
        if (requestSuites.length === 0) {
            throw new Error(`No request suite found in: ${location}`);
        }
        return requestSuites[0];
    }

    async loadSuite(location: string): Promise<Suite<Request>> {
        return await this.loadRequestSuite(location);
    }

    loadSuiteSync(location: string): Suite<Request> {
        return this.loadRequestSuiteSync(location);
    }

    /**
     * Throws if location or suite not found
     */
    async loadCaseSuites(location: string): Promise<Suite<Case>[]> {
        const caseSuites = await this.loadCases([location]);
        if (caseSuites.length === 0) {
            throw new Error(`No case suite found in: ${location}`);
        }
        return caseSuites;
    }

    async loadCases(file: string): Promise<Suite<Case>[]>;
    async loadCases(...files: string[]): Promise<Suite<Case>[]>;
    async loadCases(files: string[], ...moreFiles: string[]): Promise<Suite<Case>[]>;
    async loadCases(files: string | string[], ...moreFiles: string[]): Promise<Suite<Case>[]> {
        if (typeof files === 'string') {
            files = [files];
        }
        if (moreFiles) {
            files = [...files, ...moreFiles];
        }
        const compileOptions = new TsCompileOptions(this.options);
        const caseLoader = new CaseLoader(files, this.options, compileOptions, this.logger);

        const suites = await caseLoader.load();
        return suites;
    }

    /**
     * Throws if location or suite not found
     */
    async loadFlowSuites(location: string): Promise<FlowSuite[]> {
        const flowSuites = await this.loadFlows([location]);
        if (flowSuites.length === 0) {
            throw new Error(`No flow suite found in: ${location}`);
        }
        return flowSuites;
    }

    async loadFlow(file: string): Promise<FlowSuite> {
        const flows = await this.loadFlows(file);
        if (flows.length === 0) throw new Error(`No flow found in: ${file}`);
        return flows[0];
    }

    async loadFlows(file: string): Promise<FlowSuite[]>;
    async loadFlows(...files: string[]): Promise<FlowSuite[]>;
    async loadFlows(files: string[], ...moreFiles: string[]): Promise<FlowSuite[]>;
    async loadFlows(files: string | string[], ...moreFiles: string[]): Promise<FlowSuite[]> {
        if (typeof files === 'string') {
            files = [files];
        }
        if (moreFiles) {
            files = [...files, ...moreFiles];
        }
        const flowLoader = new FlowLoader(files, this.options, this.logger);
        const suites = await flowLoader.load();
        return suites;
    }
}

/**
 * A Plyee is a test (request/case), or a suite.
 *
 * Format: <absolute_suite_file_forward_slashes>#<optional_case_suite>^<test_name>
 * eg: c:/ply/ply/test/ply/requests/movie-queries.ply.yaml#moviesByYearAndRating
 * or: /Users/me/ply/ply/test/ply/cases/movieCrud.ply.ts#movie-crud^add new movie
 * or for a suite: /Users/me/ply/ply/test/ply/requests/movie-queries.ply.yaml
 * (TODO: handle caseFile#suite^case)
 */
export class Plyee {
    readonly path: string;
    private hash: number;
    private hat: number;

    constructor(suite: string, test: Test);
    constructor(path: string);
    constructor(pathOrSuite: string, test?: Test) {
        if (test) {
            this.path =
                util.fwdSlashes(path.normalize(path.resolve(pathOrSuite))) + `#${test.name}`;
        } else {
            const hash = pathOrSuite.indexOf('#');
            if (hash === 0 || hash > pathOrSuite.length - 2) {
                throw new Error(`Invalid path: ${pathOrSuite}`);
            }
            if (hash === -1 && pathOrSuite.endsWith('.ply')) {
                // path and test will be the same
                this.path = util.fwdSlashes(path.normalize(path.resolve(pathOrSuite)));
            } else {
                const base = pathOrSuite.substring(0, hash);
                const frag = pathOrSuite.substring(hash + 1);
                this.path = util.fwdSlashes(path.normalize(path.resolve(base))) + `#${frag}`;
            }
        }
        this.hash = this.path.indexOf('#');
        this.hat = this.path.lastIndexOf('^');
        if (this.hat < this.hash || this.hat < this.path.length - 1) {
            this.hat = -1;
        }
    }

    get location(): string {
        if (this.hash > 0) {
            return this.path.substring(0, this.hash);
        } else {
            return this.path;
        }
    }

    get suite(): string {
        if (this.hat > 0) {
            return this.path.substring(this.hash + 1, this.hat);
        } else {
            return this.location;
        }
    }

    get test(): string | undefined {
        if (this.hash > 0) {
            if (this.hat > 0) {
                return this.path.substring(this.hat + 1);
            } else {
                return this.path.substring(this.hash + 1);
            }
        } else if (this.path.endsWith('.ply')) {
            return this.path;
        }
    }

    toString(): string {
        return this.path;
    }

    static isRequest(path: string): boolean {
        return path.endsWith('.ply') || path.endsWith('.yml') || path.endsWith('.yaml');
    }

    static isCase(path: string): boolean {
        return path.endsWith('.ts');
    }

    static isFlow(path: string): boolean {
        return path.endsWith('.flow');
    }

    /**
     * Maps plyee paths to Plyee by Suite.
     */
    static requests(paths: string[]): Map<string, Plyee[]> {
        return this.collect(paths, (plyee) => Plyee.isRequest(plyee.location));
    }

    static cases(paths: string[]): Map<string, Plyee[]> {
        return this.collect(paths, (plyee) => Plyee.isCase(plyee.location));
    }

    static flows(paths: string[]): Map<string, Plyee[]> {
        return this.collect(paths, (plyee) => Plyee.isFlow(plyee.location));
    }

    /**
     * Returns a map of unique suite location to Plyee[]
     * @param paths test paths
     * @param test (optional) for matching
     */
    static collect(paths: string[], test?: (plyee: Plyee) => boolean): Map<string, Plyee[]> {
        const map = new Map<string, Plyee[]>();
        for (const path of paths) {
            const plyee = new Plyee(path);
            if (!test || test(plyee)) {
                let plyees = map.get(plyee.location);
                if (!plyees) {
                    plyees = [];
                    map.set(plyee.location, plyees);
                }
                plyees.push(plyee);
            }
        }
        return map;
    }
}

/**
 * Utility for executing multiple tests, organized into their respective suites.
 * Used by both CLI and vscode-ply.
 */
export class Plier extends EventEmitter {
    private readonly ply: Ply;
    /**
     * general purpose logger not associated with suite (goes to console)
     */
    readonly logger: Log;

    get options() {
        return this.ply.options;
    }

    constructor(options?: Options, logger?: Log) {
        // @ts-ignore node 12 takes no params
        super({ captureRejections: true });

        const opts = Object.assign({}, new Defaults(), options || new Config().options);
        this.logger =
            logger ||
            new Logger({
                level: opts.verbose ? LogLevel.debug : opts.quiet ? LogLevel.error : LogLevel.info,
                prettyIndent: opts.prettyIndent
            });

        this.ply = new Ply(options, this.logger);
    }

    /**
     * Plyees should be test paths (not suites).
     * TODO: DRY this out
     */
    async run(
        plyees: string[],
        runOptions?: RunOptions,
        plyVersion?: string
    ): Promise<OverallResults> {
        const version = plyVersion || (await util.plyVersion());
        if (version) this.logger.info('Ply version', version);

        this.logger.debug('Options', this.options);

        const plyValues = new Values(this.options.valuesFiles, this.logger);
        let values = await plyValues.read();
        if (runOptions?.values) {
            // runOptions values override file files
            values = { ...values, ...runOptions.values };
        }
        this.logger.debug('Values', values);

        // remove all previous runs
        await rimraf(`${this.options.logLocation}/runs`);

        let promises: Promise<Result[]>[] = []; // for parallel exec
        const overall: OverallResults = {
            Passed: 0,
            Failed: 0,
            Errored: 0,
            Pending: 0,
            Submitted: 0
        };

        // requests
        const requestTests = new Map<Suite<Request>, string[]>();
        for (const [loc, requestPlyee] of Plyee.requests(plyees)) {
            const requestSuite = await this.ply.loadRequestSuite(loc);
            const tests = requestPlyee.map((plyee) => {
                if (!plyee.test) {
                    throw new Error(`Plyee is not a test: ${plyee}`);
                }
                if (plyee.test.endsWith('.ply') && requestSuite.size()) {
                    return requestSuite.all().values().next().value.name;
                }
                return plyee.test;
            });
            requestSuite.emitter = this;
            requestTests.set(requestSuite, tests);
        }

        const requestRunner = new PlyRunner(this.ply.options, requestTests, plyValues, this.logger);
        await requestRunner.runSuiteTests(values, runOptions);
        // TODO overall results should not count each request, but suites?
        if (this.ply.options.parallel) {
            promises = [...promises, ...requestRunner.promises];
        } else {
            requestRunner.results.forEach((result) => overall[result.status]++);
        }

        // flows
        const flowTests = new Map<FlowSuite, string[]>();
        for (const [loc, flowPlyee] of Plyee.flows(plyees)) {
            const tests = flowPlyee.map((plyee) => {
                if (!plyee.test) {
                    throw new Error(`Plyee is not a test: ${plyee}`);
                }
                return plyee.test;
            });
            const flowSuites = await this.ply.loadFlowSuites(loc);
            for (const flowSuite of flowSuites) {
                // should only be one per loc
                flowSuite.emitter = this;
                flowTests.set(flowSuite, tests);
            }
        }

        const flowRunner = new PlyRunner(this.ply.options, flowTests, plyValues, this.logger);
        await flowRunner.runSuiteTests(values, runOptions);
        if (this.ply.options.parallel) {
            promises = [...promises, ...flowRunner.promises];
        } else {
            flowRunner.results.forEach((result) => overall[result.status]++);
        }

        // cases
        const caseTests = new Map<Suite<Case>, string[]>();
        for (const [loc, casePlyee] of Plyee.cases(plyees)) {
            const tests = casePlyee.map((plyee) => {
                if (!plyee.test) {
                    throw new Error(`Plyee is not a test: ${plyee}`);
                }
                return plyee.test;
            });
            const caseSuites = await this.ply.loadCaseSuites(loc);
            for (const caseSuite of caseSuites) {
                // should only be one per loc
                caseSuite.emitter = this;
                caseTests.set(caseSuite, tests);
            }
        }

        const caseRunner = new PlyRunner(this.ply.options, caseTests, plyValues, this.logger);
        await caseRunner.runSuiteTests(values, runOptions);
        if (this.ply.options.parallel) {
            promises = [...promises, ...caseRunner.promises];
        } else {
            caseRunner.results.forEach((result) => overall[result.status]++);
        }

        if (this.ply.options.parallel) {
            const allResults = await Promise.all(promises);
            allResults.forEach((results) => results.forEach((res) => overall[res.status]++));
        }

        if (this.options.reporter) {
            const factory = new ReporterFactory(this.options.reporter);
            const reporter = await factory.createReporter();
            await reporter.report({
                format: factory.format,
                output:
                    this.options.outputFile ||
                    `${this.options.logLocation}/ply-runs.${factory.format}`,
                runsLocation: `${this.options.logLocation}/runs`,
                logger: this.logger,
                indent: this.options.prettyIndent
            });
        }

        return overall;
    }

    /**
     * Finds plyees from suites and tests.
     * @param paths suite/test paths
     */
    async find(paths: string[]): Promise<string[]> {
        const plyees: string[] = [];
        for (const path of paths) {
            if (path.indexOf('#') > 0) {
                plyees.push(path);
            } else {
                // suite
                if (Plyee.isRequest(path)) {
                    const requestSuite = await this.ply.loadRequestSuite(path);
                    if (!requestSuite.skip) {
                        if (path.endsWith('.ply')) {
                            plyees.push(path);
                        } else {
                            for (const request of requestSuite) {
                                plyees.push(
                                    this.ply.options.testsLocation +
                                        '/' +
                                        requestSuite.path +
                                        '#' +
                                        request.name
                                );
                            }
                        }
                    }
                } else if (Plyee.isCase(path)) {
                    const caseSuites = await this.ply.loadCaseSuites(path);
                    for (const caseSuite of caseSuites) {
                        if (!caseSuite.skip) {
                            for (const testCase of caseSuite) {
                                plyees.push(
                                    this.ply.options.testsLocation +
                                        '/' +
                                        caseSuite.path +
                                        '#' +
                                        testCase.name
                                );
                            }
                        }
                    }
                } else if (Plyee.isFlow(path)) {
                    const flowSuites = await this.ply.loadFlowSuites(path);
                    for (const flowSuite of flowSuites) {
                        if (!flowSuite.skip) {
                            for (const step of flowSuite) {
                                plyees.push(
                                    this.ply.options.testsLocation +
                                        '/' +
                                        flowSuite.path +
                                        '#' +
                                        step.name
                                );
                            }
                        }
                    }
                }
            }
        }
        return plyees;
    }
}
