import { StepExec, ExecResult } from './exec';
import { ExecContext } from './context';
import { LogLevel } from '../log';

export class StopExec extends StepExec {
    async run(context: ExecContext): Promise<ExecResult> {
        if (!context.subflow) {
            let name = context.flowInstance.flowPath;
            const lastSlash = name.lastIndexOf('/');
            if (lastSlash > 0 && lastSlash < name.length - 1) name = name.substring(lastSlash + 1);
            const runId =
                context.logger.level === LogLevel.debug
                    ? ` (${context.stepInstance.flowInstanceId})`
                    : '';
            context.logger.info(`Finished flow: ${name}${runId}`);
        }
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
