import { PlyOptions } from './options';
import { Response } from './response';

export type TestType = 'request' | 'case' | 'workflow';

export interface Test {

    suitePath: string;
    name: string;
    type: TestType

    /**
     * zero-based
     */
    startLine: number;
    endLine?: number;

    /**
     * run the test
     */
    run(options: PlyOptions, values: object): Promise<Response>;
}

