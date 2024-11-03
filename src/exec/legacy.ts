import { Step, StepInstance } from '../flowbee';
import { ExecContext } from './context';
import { RunOptions } from '../options';
import { Values } from '../values';
import { ResultData, Outcome, Verifier } from '../result';
import { Runtime } from '../runtime';
import { Log } from '../log';
import { replace, replaceLine } from '../replace';
import { lines } from '../util';
import { ExecResult, StepExec } from './exec';

/**
 * Wraps a legacy PlyExecBase implementation
 */
export class LegacyExec extends StepExec {
    constructor(private plyExecBase: PlyExecBase) {
        super();
    }

    async run(context: ExecContext): Promise<ExecResult> {
        return this.plyExecBase.run(context.runtime, context.values, context.runOptions);
    }
}

/**
 * @deprecated Extend StepExec or implement PlyExec directly
 */
export abstract class PlyExecBase {
    legacy = true;

    constructor(readonly step: Step, readonly instance: StepInstance, readonly logger: Log) {}

    async runLegacy(context: ExecContext): Promise<ExecResult> {
        return this.run(context.runtime, context.values, context.runOptions);
    }

    abstract run(runtime: Runtime, values: Values, runOptions?: RunOptions): Promise<ExecResult>;

    protected evaluateToString(expr: string, values: Values, trusted = false): string {
        return replaceLine(expr, values, { trusted, logger: this.logger });
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
