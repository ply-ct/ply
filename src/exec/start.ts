import * as flowbee from 'flowbee';
import { ExecResult, PlyExecBase } from './exec';
import { Logger } from '../logger';

export class StartExec extends PlyExecBase {
    constructor(
        readonly step: flowbee.Step,
        readonly instance: flowbee.StepInstance,
        readonly logger: Logger
    ) {
        super(step, instance, logger);
    }

    async run(): Promise<ExecResult> {
        // result simply driven by instance status
        if (this.instance.status === 'In Progress') {
            // not overwritten by step execution
            this.instance.status = 'Completed';
        }
        return this.mapToExecResult(this.instance);
    }
}
