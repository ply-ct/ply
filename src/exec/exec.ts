import * as flowbee from 'flowbee';
import { RunOptions } from '../options';
import { ResultStatus } from '../result';
import { Runtime } from '../runtime';
import { Log } from '../log';
import { replace } from '../replace';
import { RESULTS } from '../names';

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
        readonly logger: Log
    ) {}

    abstract run(runtime: Runtime, values: any, runOptions?: RunOptions): Promise<ExecResult>;

    protected evaluateToString(expr: string, values: any): string {
        if (this.isExpression(expr)) {
            this.logger.debug(`Evaluating expression '${expr}' against values`, values);
            const ex = expr.replace(/@\[/g, RESULTS + '[').replace(/@/g, RESULTS + '.');
            const fun = new Function(...Object.keys(values), 'return `' + ex + '`');
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

    /**
     * Returns a substituted attribute value
     */
    protected getAttribute(
        name: string,
        values: object,
        options?: { trusted?: boolean; required?: boolean }
    ): string | undefined {
        if (this.step.attributes) {
            const val = this.step.attributes[name];
            if (val) {
                return replace(val, values, { logger: this.logger, trusted: options?.trusted });
            }
        }
        if (options?.required) throw new Error(`Missing required attribute: ${name}`);
    }

    isTrustRequired(): boolean {
        return true;
    }

    isExpression(input: string): boolean {
        return input.startsWith('${') && input.endsWith('}');
    }
}
