import { Step, StepInstance } from '../flowbee';
import { RunOptions } from '../options';
import { Values } from '../values';
import { ResultStatus, ResultData, Outcome, Verifier } from '../result';
import { Runtime } from '../runtime';
import { Log } from '../log';
import { replace, replaceLine } from '../replace';
import { lines } from '../util';
import { Diff } from '../compare';

export interface ExecResult {
    status: ResultStatus;
    message?: string;
    data?: ResultData;
    diffs?: Diff[];
}

export interface PlyExec {
    run(runtime: Runtime, values: Values, runOptions?: RunOptions): Promise<ExecResult>;
}

export abstract class PlyExecBase implements PlyExec {
    constructor(readonly step: Step, readonly instance: StepInstance, readonly logger: Log) {}

    abstract run(runtime: Runtime, values: Values, runOptions?: RunOptions): Promise<ExecResult>;

    protected evaluateToString(expr: string, values: Values, trusted = false): string {
        return replaceLine(expr, values, { trusted, logger: this.logger });
    }

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

    /**
     * Returns a substituted attribute value
     */
    protected getAttribute(
        name: string,
        values: Values,
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

    async verifyData(
        runtime: Runtime,
        data: ResultData,
        values: Values,
        runOptions?: RunOptions
    ): Promise<Outcome> {
        if (runOptions?.submit) return { status: 'Submitted', data };
        if (runOptions?.createExpected) return { status: 'Passed', data };

        const indent = runtime.options.prettyIndent;
        const actualYaml = runtime.results.getActualYaml(this.step.id);
        let actualYamlText = actualYaml.text + 'data: |\n'.padStart(8 + indent);
        for (const line of lines(JSON.stringify(data, null, indent))) {
            actualYamlText += line.padStart(line.length + 2 * indent) + '\n';
        }

        const expectedYaml = await runtime.results.getExpectedYaml(this.step.id);

        const verifier = new Verifier(
            this.step.name.replace(/\r?\n/g, ' '),
            expectedYaml,
            this.logger
        );
        const outcome = verifier.verify(
            { ...actualYaml, text: actualYamlText },
            values,
            runOptions
        );
        outcome.data = data;
        return outcome;
    }

    /**
     * Tagged log at info level
     */
    logInfo(message: string, obj?: any) {
        this.logger.info(`${this.step.id} => ${message}`, obj);
    }

    /**
     * Tagged log at error level
     */
    logError(message: string, obj?: any) {
        this.logger.error(`${this.step.id} => ${message}`, obj);
    }

    /**
     * Tagged log at debug level
     */
    logDebug(message: string, obj?: any) {
        this.logger.debug(`${this.step.id} => ${message}`, obj);
    }
}
