import { StepExec, ExecResult } from './exec';
import { ExecContext } from './context';

export class LogExec extends StepExec {
    async run(context: ExecContext): Promise<ExecResult> {
        const message = context.getAttribute('message', { required: true })!;
        const level = context.getAttribute('level');
        if (level === 'Error') {
            context.logError(message);
        } else if (level === 'Debug') {
            context.logDebug(message);
        } else {
            context.logInfo(message);
        }
        return { status: 'Passed' };
    }
}
