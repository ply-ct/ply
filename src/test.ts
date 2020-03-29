import { Runtime } from './runtime';
import { Result } from './result';

export type TestType = 'request' | 'case' | 'workflow';

export interface Test {

    name: string;

    /**
     * zero-based
     */
    startLine?: number;
    endLine?: number;

    /**
     * run the test
     * @returns result with request outcomes and status of 'Pending'
     */
    run(runtime: Runtime): Promise<Result>;
}

