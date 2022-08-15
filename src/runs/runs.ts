import * as fs from 'fs';
import * as path from 'path';
import * as glob from 'glob';
import { Storage } from '../storage';
import { PlyResults, RunResult, SuiteRun, TestRun } from '../runs/model';
import { Request } from '../request';
import { Response } from '../response';
import { Test } from '../test';
import { Outcome } from '../result';

export class Runs {
    constructor(readonly path: string) {}

    readRun(name: string, runNumber: number, test: string): TestRun | undefined {
        const run = this.readRuns(name, runNumber).find((run) => run.test === test);
        if (run?.request?.submitted && run.response) {
            // for vscode-ply request editor
            (run.response as any).submitted = run.request.submitted;
        }
        return run;
    }

    readRuns(name: string, runNumber: number): TestRun[] {
        const storage = new Storage(`${this.path}/${name}.${runNumber + 1}.json`);
        const content = storage.read();
        if (content) {
            return JSON.parse(content);
        }
        return [];
    }

    writeRun(
        name: string,
        test: Test,
        outcome: Outcome & { request?: Request; response?: Response },
        message?: string,
        runNumber = 0
    ) {
        const testRun: TestRun = {
            name: (test as any).stepName || test.name,
            test: test.name,
            type: test.type,
            ...(outcome.start && { start: new Date(outcome.start).toISOString() as any }), // serialized as string
            ...(outcome.end && { end: new Date(outcome.end).toISOString() as any }), // serialized as string
            result: {
                status: outcome.status,
                ...(message && { message })
            }
        };
        if (outcome.request) testRun.request = outcome.request;
        if (outcome.response) testRun.response = outcome.response;

        const storage = new Storage(`${this.path}/${name}.${runNumber + 1}.json`);
        const content = storage.read();
        const testRuns: TestRun[] = content ? JSON.parse(content) : [];
        testRuns.push(testRun);
        storage.write(JSON.stringify(testRuns, null, 2));
    }

    async findRunFiles(runsLocation: string, pattern: string): Promise<string[]> {
        return new Promise((resolve, reject) => {
            glob(pattern, { cwd: runsLocation }, (err, matches) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(matches.map((m) => `${runsLocation}/${m}`));
                }
            });
        });
    }

    async loadSuiteRuns(
        pattern = '**/*.json',
        filter?: (testRun: TestRun) => boolean
    ): Promise<SuiteRun[]> {
        const runFiles = await this.findRunFiles(this.path, pattern);
        const suiteRuns: SuiteRun[] = [];
        for (const runFile of runFiles) {
            const base = path.basename(runFile, '.json');
            const lastDot = base.lastIndexOf('.');
            const suiteName = base.substring(0, lastDot);
            const runNumber = parseInt(base.substring(lastDot + 1));
            const contents = await fs.promises.readFile(runFile, { encoding: 'utf-8' });
            let testRuns: TestRun[] = JSON.parse(contents);

            if (filter) testRuns = testRuns.filter(filter);

            testRuns.forEach((tr) => {
                if (tr.start) tr.start = new Date(tr.start);
                if (tr.end) tr.end = new Date(tr.end);
            });

            const consolidateResults = (testRuns: TestRun[]): RunResult => {
                let anySubmitted = false;
                for (const testRun of testRuns) {
                    if (testRun.result.status === 'Failed' || testRun.result.status === 'Errored') {
                        return testRun.result;
                    } else if (testRun.result.status === 'Submitted') {
                        anySubmitted = true;
                    }
                }
                return { status: anySubmitted ? 'Submitted' : 'Passed' };
            };

            let suitePath = `${path.relative(this.path, path.dirname(runFile))}${
                path.sep
            }${suiteName}`;
            // undo file path double-dipping
            const segs = suitePath.split(path.sep);
            if (segs.length % 2 === 0) {
                suitePath = segs.slice(segs.length / 2).join(path.sep);
            }

            suiteRuns.push({
                suite: suitePath,
                run: runNumber,
                result: consolidateResults(testRuns),
                ...(testRuns.length > 0 && testRuns[0].start && { start: testRuns[0].start }),
                ...(testRuns.length > 0 &&
                    testRuns[testRuns.length - 1].end && {
                        end: testRuns[testRuns.length - 1].end
                    }),
                testRuns
            });
        }
        suiteRuns.sort((r1, r2) => {
            if (r1.suite === r2.suite) {
                return r1.run - r2.run;
            } else {
                return r1.suite.localeCompare(r2.suite);
            }
        });
        return suiteRuns;
    }

    async loadPlyResults(
        pattern = '**/*.json',
        filter?: (testRun: TestRun) => boolean
    ): Promise<PlyResults> {
        const suiteRuns = await this.loadSuiteRuns(pattern, filter);
        const overall = { Passed: 0, Failed: 0, Errored: 0, Pending: 0, Submitted: 0 };
        suiteRuns.forEach((sr) => {
            overall[sr.result.status]++;
        });

        return { overall, runs: suiteRuns };
    }
}
