import { StepExec, ExecResult } from './exec';
import { ExecContext } from './context';

export class SyncExec extends StepExec {
    async run(context: ExecContext): Promise<ExecResult> {
        const mode = context.getAttribute('mode');
        const awaitAll = !mode?.startsWith('Await any');
        if (awaitAll) {
            const upstreamSteps = (context.flow.steps || []).filter((step) =>
                step.links?.find((link) => link.to === context.step.id)
            );
            const done = upstreamSteps.every((step) => {
                const stepInstance = context.flowInstance.stepInstances?.find(
                    (si) => si.stepId === step.id
                );
                return stepInstance?.status === 'Completed';
            });
            if (done) {
                return { status: 'Passed' };
            } else {
                return { status: 'Waiting' };
            }
        } else {
            return { status: 'Passed' };
        }
    }
}
