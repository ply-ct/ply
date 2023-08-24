import { ValuesBuilder } from '../values';
import { Step, StepInstance } from '../flowbee';
import { ExecResult, PlyExecBase } from './exec';
import { Runtime } from '../runtime';
import { Log } from '../log';

/**
 * Cannot have side-effects (no updating values);
 */
export class DeciderExec extends PlyExecBase {
    constructor(readonly step: Step, readonly instance: StepInstance, readonly logger: Log) {
        super(step, instance, logger);
    }

    async run(_runtime: Runtime, values: ValuesBuilder): Promise<ExecResult> {
        const expression = this.step.attributes?.expression;
        if (expression) {
            let expr = expression;
            if (!this.isExpression(expr)) {
                expr = '${' + expr + '}';
            }
            const result = this.evaluateToString(expr, values);
            this.instance.result = result;
            return { status: 'Passed' };
        } else {
            return { status: 'Errored', message: 'Missing attribute: expression' };
        }
    }

    isTrustRequired() {
        return true;
    }
}
