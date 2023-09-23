import { Values } from '../values';
import { Step, StepInstance } from '../flowbee';
import { ExecResult, PlyExecBase } from './exec';
import { Runtime } from '../runtime';
import { Log } from '../log';
import { RunOptions } from '../options';

export class ValueExec extends PlyExecBase {
    constructor(readonly step: Step, readonly instance: StepInstance, readonly logger: Log) {
        super(step, instance, logger);
    }

    async run(_runtime: Runtime, values: Values, runOptions?: RunOptions): Promise<ExecResult> {
        const trusted = runOptions?.trusted;
        const name = this.getAttribute('name', values, { trusted, required: true })!;
        const expression = this.getAttribute('expression', values, { trusted, required: true })!;
        values[name] = this.evaluateToString(expression, values, trusted);
        this.logger.debug(`Set value ${name} = ${values[name]}`);
        return { status: 'Passed' };
    }
}
