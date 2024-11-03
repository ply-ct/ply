import { StepExec, ExecResult } from './exec';
import { ExecContext } from './context';

export class DelayExec extends StepExec {
    async run(context: ExecContext): Promise<ExecResult> {
        let interval = context.step.attributes?.interval;
        if (interval) {
            if (this.isExpression(interval)) {
                interval = context.evaluateToString(interval);
            }
            const ms = Number(interval);
            if (isNaN(ms)) {
                return { status: 'Errored', message: `Bad value for 'interval': ${interval}` };
            }
            context.logDebug(`Delaying ${ms} ms`);
            await this.delay(ms);
            return { status: 'Passed' };
        } else {
            return { status: 'Errored', message: 'Missing attribute: interval' };
        }
    }

    private delay(ms: number): Promise<void> {
        return new Promise((resolve) => {
            setTimeout(() => {
                resolve();
            }, ms);
        });
    }

    isTrustRequired(context: ExecContext): boolean {
        return this.isExpression(context.step.attributes?.interval || '');
    }
}
