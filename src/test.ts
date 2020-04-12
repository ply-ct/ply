import { Runtime } from './runtime';
import { Result } from './result';

export type TestType = 'request' | 'case' | 'workflow';

export interface Test {

    name: string;
    type: TestType;

    /**
     * zero-based
     */
    startLine?: number;
    endLine?: number;
}

export interface PlyTest {
    invoke(runtime: Runtime): Promise<Result>;
}
