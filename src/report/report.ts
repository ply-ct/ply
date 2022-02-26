import * as fs from 'fs';
import * as path from 'path';
import * as glob from 'glob';
import { PlyResults, Reporter, ReportFormat, RunResult, SuiteRun, TestRun } from './model';
import { Log } from '../logger';
import { JsonReporter } from './json';
import { HtmlReporter } from './html';

export class Report {
  constructor(readonly format: ReportFormat, readonly logger: Log) {}

  createReporter(): Reporter {
    switch (this.format) {
      case "json": {
        return new JsonReporter(this.logger);
      }
      case "html": {
        return new HtmlReporter(this.logger);
      }
    }
  }
}

export const findRunFiles = async (runsLocation: string): Promise<string[]> => {
    return new Promise((resolve, reject) => {
        glob('**/*.json', { cwd: runsLocation }, (err, matches) => {
            if (err) {
                reject(err);
            } else {
                resolve(matches.map(m => `${runsLocation}/${m}`));
            }
        });
    });
};

/**
 * TODO stream
 */
export const loadSuiteRuns = async (runsLocation: string): Promise<PlyResults> => {
    const runFiles = await findRunFiles(runsLocation);
    const suiteRuns: SuiteRun[] = [];
    for (const runFile of runFiles) {
        const base = path.basename(runFile, '.json');
        const lastDot = base.lastIndexOf('.');
        const suiteName = base.substring(0, lastDot);
        const runNumber = parseInt(base.substring(lastDot + 1));
        const contents = await fs.promises.readFile(runFile, { encoding: "utf-8" });
        const testRuns: TestRun[] = JSON.parse(contents);

        testRuns.forEach(tr => {
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

        suiteRuns.push({
          suite: suiteName,
          run: runNumber,
          result: consolidateResults(testRuns),
          ...(testRuns.length > 0 && testRuns[0].start && { start: testRuns[0].start }),
          ...(testRuns.length > 0 && testRuns[testRuns.length - 1].end && { end: testRuns[testRuns.length - 1].end }),
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
    const overall = { Passed: 0, Failed: 0, Errored: 0, Pending: 0, Submitted: 0 };
    suiteRuns.forEach(sr => {
        overall[sr.result.status]++;
    });

    return { overall, runs: suiteRuns };
};

