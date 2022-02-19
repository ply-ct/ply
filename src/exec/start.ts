import * as flowbee from 'flowbee';
import { ExecResult, PlyExecBase } from './exec';
import { Suite } from '../suite';
import { Request } from '../request';
import { Logger } from '../logger';

export class StartExec extends PlyExecBase {

    constructor(
        private readonly requestSuite: Suite<Request>, // unique
        readonly step: flowbee.Step,
        readonly instance: flowbee.StepInstance,
        readonly logger: Logger,
        readonly subflow?: flowbee.Subflow
    ) {
        super(step, instance, logger, subflow);
    }

    async run(): Promise<ExecResult> {
        // result simply driven by instance status
        if (this.instance.status === 'In Progress') { // not overwritten by step execution
            this.instance.status = 'Completed';
        }
        return this.mapToExecResult(this.instance);
    }

}