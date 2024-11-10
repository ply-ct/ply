import { StepInstance } from '../flowbee';
import { RunOptions } from '../options';
import { ResultStatus, ResultData } from '../result';
import { Diff } from '../compare';
import { ExecContext } from './context';

export interface ExecResult {
    status: ResultStatus;
    message?: string;
    data?: ResultData;
    diffs?: Diff[];
}

export interface PlyExec {
    run(context: ExecContext): Promise<ExecResult>;
}

export abstract class StepExec implements PlyExec {
    abstract run(context: ExecContext): Promise<ExecResult>;

    /**
     * Maps instance status to ply result
     */
    protected mapToExecResult(instance: StepInstance, runOptions?: RunOptions): ExecResult {
        let execResult: ExecResult;
        if (instance.status === 'In Progress' || instance.status === 'Waiting') {
            execResult = { status: 'Pending' };
        } else if (instance.status === 'Completed' || instance.status === 'Canceled') {
            execResult = { status: runOptions?.submit ? 'Submitted' : 'Passed' };
        } else {
            execResult = { status: instance.status };
        }
        if (instance.message) execResult.message = instance.message;
        return execResult;
    }

    isTrustRequired(_context: ExecContext): boolean {
        return true;
    }

    isExpression(input: string): boolean {
        return input.startsWith('${') && input.endsWith('}');
    }
}
