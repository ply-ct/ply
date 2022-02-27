import * as flowbee from 'flowbee';
import { ExecResult, PlyExecBase } from './exec';
import { LogLevel, Logger } from '../logger';

export class StopExec extends PlyExecBase {
    constructor(
        private readonly flowPath: string, // unique
        readonly step: flowbee.Step,
        readonly instance: flowbee.StepInstance,
        readonly logger: Logger,
        readonly subflow?: flowbee.Subflow
    ) {
        super(step, instance, logger, subflow);
    }

    async run(): Promise<ExecResult> {
        if (!this.subflow) {
            let name = this.flowPath;
            const lastSlash = name.lastIndexOf('/');
            if (lastSlash > 0 && lastSlash < name.length - 1) name = name.substring(lastSlash + 1);
            const runId =
                this.logger.level === LogLevel.debug ? ` (${this.instance.flowInstanceId})` : '';
            this.logger.info(`Finished flow: ${name}${runId}`);
        }
        // result simply driven by instance status
        if (this.instance.status === 'In Progress') {
            // not overwritten by step execution
            this.instance.status = 'Completed';
        }
        return this.mapToExecResult(this.instance);
    }
}
