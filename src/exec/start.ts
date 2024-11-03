import { StepExec, ExecResult } from './exec';
import { ExecContext } from './context';

export class StartExec extends StepExec {
    async run(context: ExecContext): Promise<ExecResult> {
        // result simply driven by instance status
        if (context.stepInstance.status === 'In Progress') {
            // not overwritten by step execution
            context.stepInstance.status = 'Completed';
        }
        return this.mapToExecResult(context.stepInstance);
    }

    isTrustRequired(): boolean {
        return false;
    }
}
