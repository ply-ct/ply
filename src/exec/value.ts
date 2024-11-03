import { StepExec, ExecResult } from './exec';
import { ExecContext } from './context';

export class ValueExec extends StepExec {
    async run(context: ExecContext): Promise<ExecResult> {
        const name = context.getAttribute('name', { required: true })!;
        const expression = context.getAttribute('expression', { required: true })!;
        context.values[name] = context.evaluateToString(expression);
        context.logDebug(`Set value ${name} = ${context.values[name]}`);
        return { status: 'Passed' };
    }
}
