import { StepExec, ExecResult } from './exec';
import { ExecContext } from './context';

/**
 * Cannot have side-effects (no updating values);
 */
export class DecideExec extends StepExec {
    async run(context: ExecContext): Promise<ExecResult> {
        const expression = context.step.attributes?.expression;
        if (expression) {
            let expr = expression;
            if (!this.isExpression(expr)) {
                expr = '${' + expr + '}';
            }
            const result = context.evaluateToString(expr);
            context.stepInstance.result = result;
            return { status: 'Passed' };
        } else {
            return { status: 'Errored', message: 'Missing attribute: expression' };
        }
    }

    isTrustRequired() {
        return true;
    }
}
