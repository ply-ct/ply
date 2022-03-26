import * as flowbee from 'flowbee';
import { ExecResult, PlyExecBase } from './exec';
import { Runtime } from '../runtime';
import { Logger } from '../logger';

/**
 * Cannot have side-effects (no updating values);
 */
export class DeciderExec extends PlyExecBase {
    constructor(
        readonly step: flowbee.Step,
        readonly instance: flowbee.StepInstance,
        readonly logger: Logger
    ) {
        super(step, instance, logger);
    }

    async run(_runtime: Runtime, values: any): Promise<ExecResult> {
        const expression = this.step.attributes?.expression;
        if (expression) {
            const result = this.evaluateToString(expression, values);
            this.instance.result = result;
            return { status: 'Passed' };
        } else {
            return { status: 'Errored', message: 'Missing attribute: expression' };
        }
    }
}
