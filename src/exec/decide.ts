import * as flowbee from 'flowbee';
import { ExecResult, PlyExecBase } from './exec';
import { Runtime } from '../runtime';
import { Logger } from '../logger';

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

    private evaluateToString(input: string, values: any): string {
        this.logger.debug(`Evaluating expression '${input}' against values`, values);
        const fun = new Function(...Object.keys(values), 'return `${' + input + '}`');
        return fun(...Object.values(values));
    }
}
