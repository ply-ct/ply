import * as flowbee from 'flowbee';
import { RunOptions } from '../options';
import { ResultStatus } from '../result';
import { Runtime } from '../runtime';
import { Logger } from '../logger';

export interface ExecResult {
    status: ResultStatus;
    message?: string;
}

export interface PlyExec {
    run(runtime: Runtime, values: object, runOptions?: RunOptions): Promise<ExecResult>;
}

export abstract class PlyExecBase implements PlyExec {
    constructor(
        readonly step: flowbee.Step,
        readonly instance: flowbee.StepInstance,
        readonly logger: Logger
    ) {}

    abstract run(runtime: Runtime, values: any, runOptions?: RunOptions): Promise<ExecResult>;

    protected evaluateToString(expr: string, values: any): string {
        if (this.isExpression(expr)) {
            this.logger.debug(`Evaluating expression '${expr}' against values`, values);
            const fun = new Function(...Object.keys(values), 'return `' + expr + '`');
            return fun(...Object.values(values));
        } else {
            return expr;
        }
    }

    /**
     * Maps instance status to ply result
     */
    protected mapToExecResult(instance: flowbee.StepInstance, runOptions?: RunOptions): ExecResult {
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

    isTrustRequired(): boolean {
        return true;
    }

    isExpression(input: string): boolean {
        return input.startsWith('${') && input.endsWith('}');
    }
}
