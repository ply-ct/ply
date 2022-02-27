import * as flowbee from 'flowbee';
import { ExecResult, PlyExecBase } from './exec';
import { Runtime } from '../runtime';
import { Logger } from '../logger';

export class GreetingExec extends PlyExecBase {
    constructor(
        readonly step: flowbee.Step,
        readonly instance: flowbee.StepInstance,
        readonly logger: Logger,
        readonly subflow?: flowbee.Subflow
    ) {
        super(step, instance, logger, subflow);
    }

    async run(runtime: Runtime, values: any): Promise<ExecResult> {
        const name = values.name || 'World';
        this.logger.info(`Hello, ${name} from step ${this.step.name} in flow ${runtime.suitePath}`);
        return { status: 'Passed' };
    }
}
