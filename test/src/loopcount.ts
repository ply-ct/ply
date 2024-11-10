import { ExecResult, StepExec } from '../../src/exec/exec';
import { ExecContext } from '../../src/exec/context';

export default class DataStep extends StepExec {
    async run(context: ExecContext): Promise<ExecResult> {
        context.values.loopCount += 1;
        return { status: 'Passed' };
    }
}
