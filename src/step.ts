import * as flowbee from './flowbee';
import * as util from './util';
import { Log } from './log';
import { RunOptions } from './options';
import { Request } from './request';
import { Runtime } from './runtime';
import { Suite } from './suite';
import { PlyTest, Test } from './test';
import { Result, ResultOptions } from './result';
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

        let key = this.stepName;
        if (instNum) key += `_${instNum}`;

        const resOpts: ResultOptions = {
            level: 0,
            withExpected: createExpected,
            subflow: this.subflow?.name
        };

        try {
            runtime.appendResult(`${key}:`, {
                ...resOpts,
                level,
                comment: util.timestamp(this.instance.start)
            });
            runtime.appendResult(`id: ${this.step.id}`, { ...resOpts, level: level + 1 });

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
                await this.requestSuite.runtime.padActualStart(this.subflow.id, instNum);
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
                await this.requestSuite.runtime.padActualStart(this.name, instNum);
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
            runtime.updateResult(key, 'data: |', { ...resOpts, level: level + 1 });
            for (const line of util.lines(dataStr)) {
                runtime.updateResult(key, line, { ...resOpts, level: level + 2 });
            }
        }

        // append status, result and message to actual result
        if (this.instance.end) {
            const elapsed = this.instance.end.getTime() - this.instance.start.getTime();
            runtime.updateResult(key, `status: ${this.instance.status}`, {
                ...resOpts,
                level: level + 1,
                comment: `${elapsed} ms`
            });

            if (typeof stepRes === 'boolean' || typeof stepRes === 'number' || stepRes) {
                this.instance.result = '' + stepRes;
                runtime.updateResult(key, `result: ${this.instance.result}`, {
                    ...resOpts,
                    level: level + 1
                });
            }
            if (this.instance.message) {
                runtime.updateResult(key, `message: '${this.instance.message}'`, {
                    ...resOpts,
                    level: level + 1
                });
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
}
