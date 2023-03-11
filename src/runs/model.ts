import { ResultStatus } from '../result';
import { TestType } from '../test';
import { Request } from '../request';
import { Response } from '../response';
import { Log } from '../log';

export interface ReportOptions {
    format: string;
    output: string;
    runsLocation: string;
    logger: Log;
    indent?: number;
}

export interface Reporter {
    report(options: ReportOptions): Promise<void>;
}

export interface RunResult {
    status: ResultStatus;
    message?: string;
}

export interface OverallResults {
    Passed: number;
    Failed: number;
    Errored: number;
    Pending: number;
    Submitted: number;
}

export interface PlyResults {
    overall: OverallResults;
    runs: SuiteRun[];
}

export interface SuiteRun {
    suite: string;
    run: number;
    result: RunResult;
    start?: Date;
    end?: Date;
    testRuns: TestRun[];
}

export interface TestRun {
    name: string;
    test: string;
    type: TestType;
    start?: Date;
    end?: Date;
    result: RunResult;
    request?: Request;
    response?: Response;
}
