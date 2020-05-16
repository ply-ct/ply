import { Runtime } from './runtime';
import { Result } from './result';

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
     * Invokes.
     */
    run(runtime: Runtime): Promise<Result | void>;
}
