import * as flowbee from './flowbee';
import * as util from './util';
import { Log } from './log';
import { RunOptions } from './options';
import { Request } from './request';
import { Runtime } from './runtime';
import { Suite } from './suite';
import { PlyTest, Test } from './test';
import { Result } from './result';
import { Values } from './values';
import { ExecFactory } from './exec/factory';
import { ContextImpl } from './exec/impl';
import { ExecResult } from './exec/exec';

export interface Step extends Test {
    step: flowbee.Step;
    instance?: flowbee.StepInstance;
    subflow?: flowbee.Subflow;
}

export function getStepId(step: Step) {
    return step.subflow ? `${step.subflow.id}-${step.step.id}` : step.step.id;
}

export class PlyStep implements Step, PlyTest {
    /**
     * This is the step id.
     */
    readonly name: string;
    readonly type = 'flow';
    readonly stepName: string;
    readonly instance: flowbee.StepInstance;
    start?: number | undefined;
    end?: number | undefined;

    constructor(
        readonly step: flowbee.Step,
        private readonly requestSuite: Suite<Request>,
        private readonly logger: Log,
        private readonly flow: flowbee.Flow,
        private readonly flowInstance: flowbee.FlowInstance,
        readonly subflow?: flowbee.Subflow
    ) {
        this.name = getStepId(this);
        this.stepName = step.name.replace(/\r?\n/g, ' ');
        this.instance = {
            id: util.genId(),
            flowInstanceId: this.flowInstance.id,
            stepId: step.id,
            status: 'In Progress'
        };
    }

    async run(
        runtime: Runtime,
        values: Values,
        runOptions?: RunOptions,
        runNum?: number,
        instNum = 0
    ): Promise<Result> {
        this.instance.start = new Date();
        let result: Result;
        let stepRes: any;
        const level = this.subflow ? 1 : 0;
        const createExpected = runOptions?.createExpected;

        try {
            let key = this.stepName;
            if (instNum) key += `_${instNum}`;
            runtime.appendResult(
                `${key}:`,
                level,
                createExpected,
                util.timestamp(this.instance.start)
            );
            runtime.appendResult(`id: ${this.step.id}`, level + 1, createExpected);

            const context = new ContextImpl({
                name: this.name,
                runtime,
                flow: this.flow,
                flowInstance: this.flowInstance,
                subflow: this.subflow,
                step: this.step,
                stepInstance: this.instance,
                logger: this.logger,
                values,
                runOptions,
                requestSuite: this.requestSuite,
                runNum,
                instNum
            });

            const exec = await ExecFactory.create(context);

            if (
                this.step.path === 'start' &&
                this.subflow &&
                !runOptions?.submit &&
                !createExpected
            ) {
                await this.padActualStart(this.subflow.id, instNum);
            }

            if (!runOptions?.trusted) {
                let trustRequired = true;
                const trustFun = (exec as any).isTrustRequired;
                if (typeof trustFun === 'function') {
                    trustRequired = trustFun(context);
                }
                if (trustRequired) {
                    throw new Error(
                        `Trusted context required for ${this.step.id}: ${this.stepName}`
                    );
                }
            }

            const execResult = await exec.run(context);

            if (
                this.step.path !== 'start' &&
                this.step.path !== 'stop' &&
                !this.step.path.endsWith('request')
            ) {
                this.instance.status = this.mapToInstanceStatus(execResult);
                if (execResult.message) this.instance.message = execResult.message;
            }

            if (!execResult.message && this.instance.message) {
                execResult.message = this.instance.message;
            }

            this.instance.end = new Date();

            if (!runOptions?.submit && !createExpected) {
                await this.padActualStart(this.name, instNum);
            }

            result = {
                name: this.stepName,
                status: execResult.status,
                message: execResult.message || ''
            };
            if (execResult.data && !this.step.path.endsWith('request')) {
                result.data = execResult.data;
                this.instance.data = execResult.data;
            }
            if (execResult.diffs) result.diffs = execResult.diffs;
        } catch (err: any) {
            this.logger.error(err.message, err);
            this.instance.status = 'Errored';
            this.instance.message = err.message;
            result = {
                name: this.stepName,
                status: 'Errored',
                message: this.instance.message || ''
            };
        }

        if (this.instance.data && !this.step.path.endsWith('request')) {
            const dataStr =
                typeof this.instance.data === 'string'
                    ? this.instance.data
                    : JSON.stringify(this.instance.data, null, runtime.options.prettyIndent);
            runtime.appendResult('data: |', level + 1, createExpected);
            for (const line of util.lines(dataStr)) {
                runtime.appendResult(line, level + 2, createExpected);
            }
        }

        // append status, result and message to actual result
        if (this.instance.end) {
            const elapsed = this.instance.end.getTime() - this.instance.start.getTime();
            runtime.appendResult(
                `status: ${this.instance.status}`,
                level + 1,
                createExpected,
                `${elapsed} ms`
            );

            if (typeof stepRes === 'boolean' || typeof stepRes === 'number' || stepRes) {
                this.instance.result = '' + stepRes;
                runtime.appendResult(`result: ${this.instance.result}`, level + 1, createExpected);
            }
            if (this.instance.message) {
                runtime.appendResult(
                    `message: '${this.instance.message}'`,
                    level + 1,
                    createExpected
                );
            }
        }

        return result;
    }

    private mapToInstanceStatus(execResult: ExecResult): flowbee.FlowElementStatus {
        if (execResult.status === 'Passed' || execResult.status === 'Submitted') {
            return 'Completed';
        } else {
            return execResult.status;
        }
    }

    private async padActualStart(name: string, instNum: number) {
        const expectedYaml = await this.requestSuite.runtime.results.getExpectedYaml(name, instNum);
        if (expectedYaml.start > 0) {
            const actualYaml = this.requestSuite.runtime.results.getActualYaml(name, instNum);
            if (expectedYaml.start > actualYaml.start) {
                this.requestSuite.runtime.results.actual.padLines(
                    actualYaml.start,
                    expectedYaml.start - actualYaml.start
                );
            }
        }
    }
}
