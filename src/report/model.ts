import { ResultStatus } from '../result';
import { TestType } from '../test';

export type ReportFormat = 'json' | 'html';

export interface ReportOptions {
    runsLocation: string;
    outputLocation: string;
    indent?: number;
}

export interface Reporter {
    report(options: ReportOptions): Promise<void>;
}

export interface RunResult {
    status: ResultStatus;
    message?: string;
}

export interface PlyResults {
    overall: {
        Passed: number,
        Failed: number,
        Errored: number,
        Pending: number,
        Submitted: number
    }
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
    test: string;
    type: TestType;
    start?: Date;
    end?: Date;
    result: RunResult;
    request?: Request;
    response?: Response;
}
