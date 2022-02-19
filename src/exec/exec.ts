import * as flowbee from 'flowbee';
import { RunOptions } from '../options';
import { ResultStatus } from '../result';
import { Runtime } from '../runtime';
import { Logger } from '../logger';

export interface ExecResult {
    status: ResultStatus;
    message?: string;
}

export interface PlyExec {
    run(runtime: Runtime, values: object, runOptions?: RunOptions): Promise<ExecResult>;
}

export abstract class PlyExecBase implements PlyExec {

    constructor(
        readonly step: flowbee.Step,
        readonly instance: flowbee.StepInstance,
        readonly logger: Logger,
        readonly subflow?: flowbee.Subflow,
    ) {
    }

    abstract run(runtime: Runtime, values: object, runOptions?: RunOptions): Promise<ExecResult>;
}

