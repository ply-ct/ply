import { Runtime } from './runtime';
import { PlyResult } from './result';

export type TestType = 'request' | 'case' | 'workflow';

export interface Test {

    name: string;
    type: TestType;

    /**
     * zero-based start line
     */
    start?: number;
    /**
     * zero-based end line
     */
    end?: number;
}

export interface PlyTest extends Test {
    /**
     * Promises a result with status of 'Pending'
     * @returns result with request outcomes and status of 'Pending'
     */
    invoke(runtime: Runtime): Promise<PlyResult>;
}
