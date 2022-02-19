import * as flowbee from 'flowbee';
import { Logger, LogLevel } from './logger';
import { RunOptions } from './options';
import { Request } from './request';
import { Runtime } from './runtime';
import { Suite } from './suite';
import { PlyTest, Test } from './test';
import { Result, ResultStatus } from './result';
import * as util from './util';
import { RequestExec } from './exec/request';
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
        private readonly logger: Logger,
        readonly flowPath: string,
        flowInstanceId: string,
        readonly subflow?: flowbee.Subflow,
    ) {
        this.name = getStepId(this);
        this.stepName = step.name.replace(/\r?\n/g, ' ');
        this.instance = {
            id: util.genId(),
            flowInstanceId,
            stepId: step.id,
            status: 'In Progress'
        };
    }

    async run(runtime: Runtime, values: object, runOptions?: RunOptions): Promise<Result> {
        this.instance.start = new Date();
        let result: Result;
        let stepRes: any;
        const level = this.subflow ? 1 : 0;
        try {
            runtime.appendResult(`${this.stepName}:`, level, runOptions?.createExpected, util.timestamp(this.instance.start));
            runtime.appendResult(`id: ${this.step.id}`, level + 1, runOptions?.createExpected);

            let execResult: ExecResult;

            if (this.subflow && this.step.path === 'start' && !runOptions?.submit && !runOptions?.createExpected) {
                this.padActualStart(this.subflow.id);
            }
            else if (this.step.path === 'stop' && !this.subflow) {
                let name = this.flowPath;
                const lastSlash = name.lastIndexOf('/');
                if (lastSlash > 0 && lastSlash < name.length - 1) name = name.substring(lastSlash + 1);
                const runId = this.logger.level === LogLevel.debug ? ` (${this.instance.flowInstanceId})` : '';
                this.logger.info(`Finished flow: ${name}${runId}`);
            } else if (this.step.path === 'request') {
                const exec = new RequestExec(this.name, this.requestSuite, this.step, this.instance, this.logger, this.subflow);
                execResult = await exec.run(runtime, values, runOptions);
            }

            if (this.step.path === 'start' || this.step.path === 'stop') {
                // result simply driven by instance status
                if (this.instance.status === 'In Progress') { // not overwritten by step execution
                    this.instance.status = 'Completed';
                }
                const resultStatus = this.mapToResultStatus(this.instance.status, runOptions);
                execResult = { status: resultStatus };
            } else {
                // general exec -- instance status driven by exec result
                // TODO execute
                execResult = { status: 'Errored', message: 'You know why' };
            }

            if (!execResult.message && this.instance.message) execResult.message = this.instance.message;

            this.instance.end = new Date();

            if (!runOptions?.submit && !runOptions?.createExpected) {
                await this.padActualStart(this.name);
            }

            result = { name: this.stepName, status: execResult.status, message: execResult.message || '' };
        } catch (err: any) {
            this.logger.error(err.message, err);
            this.instance.status = 'Errored';
            this.instance.message = err.message;
            result = { name: this.stepName, status: 'Errored', message: this.instance.message || '' };
        }

        // append status, result and message to actual result
        if (this.instance.end) {
            const elapsed = this.instance.end.getTime() - this.instance.start.getTime();
            runtime.appendResult(`status: ${this.instance.status}`, level + 1, runOptions?.createExpected, `${elapsed} ms`);

            if (typeof stepRes === 'boolean' || typeof stepRes === 'number' || stepRes) {
                this.instance.result = '' + stepRes;
                runtime.appendResult(`result: ${this.instance.result}`, level + 1, runOptions?.createExpected);
            }
            if (this.instance.message) {
                runtime.appendResult(`message: '${this.instance.message}'`, level + 1, runOptions?.createExpected);
            }
        }

        return result;
    }

    private async padActualStart(name: string) {
        const expectedYaml = await this.requestSuite.runtime.results.getExpectedYaml(name);
        if (expectedYaml.start > 0) {
            const actualYaml = this.requestSuite.runtime.results.getActualYaml(name);
            if (expectedYaml.start > actualYaml.start) {
                this.requestSuite.runtime.results.actual.padLines(actualYaml.start, expectedYaml.start - actualYaml.start);
            }
        }
    }

    /**
     * Maps instance status to ply result
     */
    private mapToResultStatus(instanceStatus: flowbee.FlowElementStatus, runOptions?: RunOptions): ResultStatus {
        let resultStatus: ResultStatus;
        if (instanceStatus === 'In Progress' || instanceStatus === 'Waiting') {
            resultStatus = 'Pending';
        } else if (instanceStatus === 'Completed' || instanceStatus === 'Canceled') {
            resultStatus = runOptions?.submit ? 'Submitted' : 'Passed';
        } else {
            resultStatus = instanceStatus;
        }
        return resultStatus;
    }
}