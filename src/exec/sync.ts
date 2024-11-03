import { StepExec, ExecResult } from './exec';
import { ExecContext } from './context';

export class SyncExec extends StepExec {
    async run(context: ExecContext): Promise<ExecResult> {
        const mode = context.getAttribute('mode');
        const awaitAll = !mode?.startsWith('Await any');
        if (awaitAll) {
        } else {
            return { status: 'Passed' };
        }

        // TODO
        return { status: 'Passed' };
    }
}
