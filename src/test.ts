import { Result } from './result';
import { Runtime } from './runtime';


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
     */
    run(runtime: Runtime, values: object): Promise<Result>;
}

