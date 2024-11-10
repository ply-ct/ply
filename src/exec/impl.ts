import * as flowbee from '../flowbee';
import { ExecContext } from './context';
import { Runtime } from '../runtime';
import { Log } from '../log';
import { RunOptions } from '../options';
import { Values } from '../values';
import { Suite } from '../suite';
import { Request } from '../request';
import { Outcome, ResultData, Verifier } from '../result';
import { replace, replaceLine } from '../replace';
import { lines } from '../util';

interface ContextBase {
    name: string;
    runtime: Runtime;
    flow: flowbee.Flow;
    flowInstance: flowbee.FlowInstance;
    subflow?: flowbee.Subflow;
    step: flowbee.Step;
    stepInstance: flowbee.StepInstance;
    logger: Log;
    values: Values;
    runOptions?: RunOptions;
    requestSuite?: Suite<Request>;
    runNum?: number;
    instNum?: number;
}

export class ContextImpl implements ExecContext {
    constructor(private readonly base: ContextBase) {}

    get name(): string {
        return this.base.name;
    }
    get runtime(): Runtime {
        return this.base.runtime;
    }
    get flow(): flowbee.Flow {
        return this.base.flow;
    }
    get flowInstance(): flowbee.FlowInstance {
        return this.base.flowInstance;
    }
    get subflow(): flowbee.Subflow | undefined {
        return this.base.subflow;
    }
    get step(): flowbee.Step {
        return this.base.step;
    }
    get stepInstance(): flowbee.StepInstance {
        return this.base.stepInstance;
    }
    get logger(): Log {
        return this.base.logger;
    }
    get values(): Values {
        return this.base.values;
    }
    get runOptions(): RunOptions | undefined {
        return this.base.runOptions;
    }
    get requestSuite(): Suite<Request> | undefined {
        return this.base.requestSuite;
    }
    get runNum(): number | undefined {
        return this.base.runNum;
    }
    get instNum(): number | undefined {
        return this.base.instNum;
    }

    evaluateToString(expr: string): string {
        return replaceLine(expr, this.values, {
            trusted: this.runOptions?.trusted,
            logger: this.logger
        });
    }

    getAttribute(name: string, options?: { required?: boolean }): string | undefined {
        if (this.step.attributes) {
            const val = this.step.attributes[name];
            if (val) {
                return replace(val, this.values, {
                    logger: this.logger,
                    trusted: this.runOptions?.trusted
                });
            }
        }
        if (options?.required) throw new Error(`Missing required attribute: ${name}`);
    }

    async verifyData(data: ResultData): Promise<Outcome> {
        if (this.runOptions?.submit) return { status: 'Submitted', data };
        if (this.runOptions?.createExpected) return { status: 'Passed', data };

        const indent = this.runtime.options.prettyIndent;
        const actualYaml = this.runtime.results.getActualYaml(this.step.id);
        let actualYamlText = actualYaml.text + 'data: |\n'.padStart(8 + indent);
        for (const line of lines(JSON.stringify(data, null, indent))) {
            actualYamlText += line.padStart(line.length + 2 * indent) + '\n';
        }

        const expectedYaml = await this.runtime.results.getExpectedYaml(this.step.id);

        const verifier = new Verifier(
            this.step.name.replace(/\r?\n/g, ' '),
            expectedYaml,
            this.logger
        );
        const outcome = verifier.verify(
            { ...actualYaml, text: actualYamlText },
            this.values,
            this.runOptions
        );
        outcome.data = data;
        return outcome;
    }

    logInfo(message: string, obj?: any) {
        this.logger.info(`${this.step.id} => ${message}`, obj);
    }
    logError(message: string, obj?: any) {
        this.logger.error(`${this.step.id} => ${message}`, obj);
    }
    logDebug(message: string, obj?: any) {
        this.logger.debug(`${this.step.id} => ${message}`, obj);
    }
}
