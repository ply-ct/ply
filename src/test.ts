import { Runtime } from './runtime';
import { Result } from './result';
import { RunOptions } from './options';
import { Values } from './values';

/**
 * step type means flow step(s) in isolation
 */
export type TestType = 'request' | 'case' | 'flow';

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
    run(
        runtime: Runtime,
        values: Values,
        runOptions?: RunOptions,
        runNum?: number
    ): Promise<Result>;
}
