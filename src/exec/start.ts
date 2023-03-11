import * as flowbee from 'flowbee';
import { ExecResult, PlyExecBase } from './exec';
import { Log } from '../log';

export class StartExec extends PlyExecBase {
    constructor(
        readonly step: flowbee.Step,
        readonly instance: flowbee.StepInstance,
        readonly logger: Log
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

    isTrustRequired(): boolean {
        return false;
    }
}
