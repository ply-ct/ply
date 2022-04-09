import * as process from 'process';
import * as path from 'path';
import * as flowbee from 'flowbee';
import { Logger } from './logger';
import { RunOptions } from './options';
import { Request } from './request';
import { Runtime } from './runtime';
import { Suite } from './suite';
import { PlyTest, Test } from './test';
import { Result } from './result';
import * as util from './util';
import { RequestExec } from './exec/request';
import { ExecResult, PlyExec } from './exec/exec';
import { StartExec } from './exec/start';
import { StopExec } from './exec/stop';
import { FlowElementStatus } from 'flowbee';
import { DeciderExec } from './exec/decide';
import { DelayExec } from './exec/delay';

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
        readonly subflow?: flowbee.Subflow
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

    async run(
        runtime: Runtime,
        values: object,
        runOptions?: RunOptions,
        runNum?: number,
        instNum = 0
    ): Promise<Result> {
        this.instance.start = new Date();
        let result: Result;
        let stepRes: any;
        const level = this.subflow ? 1 : 0;

        try {
            let key = this.stepName;
            if (instNum) key += `_${instNum}`;
            runtime.appendResult(
                `${key}:`,
                level,
                runOptions?.createExpected,
                util.timestamp(this.instance.start)
            );
            runtime.appendResult(`id: ${this.step.id}`, level + 1, runOptions?.createExpected);

            let exec: PlyExec;

            if (this.step.path === 'start') {
                if (this.subflow && !runOptions?.submit && !runOptions?.createExpected) {
                    await this.padActualStart(this.subflow.id, instNum);
                }
                exec = new StartExec(this.step, this.instance, this.logger);
            } else if (this.step.path === 'stop') {
                exec = new StopExec(
                    this.flowPath,
                    this.step,
                    this.instance,
                    this.logger,
                    this.subflow
                );
            } else if (this.step.path === 'request') {
                exec = new RequestExec(
                    this.name,
                    this.requestSuite,
                    this.step,
                    this.instance,
                    this.logger,
                    runNum,
                    instNum
                );
            } else if (this.step.path === 'decide') {
                exec = new DeciderExec(this.step, this.instance, this.logger);
            } else if (this.step.path === 'delay') {
                exec = new DelayExec(this.step, this.instance, this.logger);
            } else if (this.step.path === 'typescript' || this.step.path.endsWith('.ts')) {
                const type = this.step.path === 'typescript' ? 'TypeScript' : 'Custom';
                let tsFile: string;
                if (type === 'TypeScript') {
                    if (!this.step.attributes?.tsFile) {
                        throw new Error(`Step ${this.step.id} missing attribute: tsFile`);
                    }
                    tsFile = this.step.attributes.tsFile;
                } else {
                    tsFile = this.step.path;
                }

                if (!path.isAbsolute(tsFile)) tsFile = path.join(process.cwd(), tsFile);
                const mod = await import(tsFile);
                if (typeof mod.default !== 'function') {
                    throw new Error(
                        `${type} step module must export PlyExec implementor class as default: ${tsFile}`
                    );
                }
                exec = new mod.default(this.step, this.instance, this.logger);
                if (typeof exec.run !== 'function') {
                    throw new Error(
                        `${type} step module must implement PlyExec.run() method: ${tsFile}`
                    );
                }
            } else {
                throw new Error(`Unsupported step: ${this.step.path}`);
            }

            if (!runOptions?.trusted) {
                let trustRequired = true;
                const trustFun = (exec as any).isTrustRequired;
                if (typeof trustFun === 'function') {
                    trustRequired = trustFun();
                }
                if (trustRequired) {
                    throw new Error(
                        `Trusted context required for ${this.step.id}: ${this.stepName}`
                    );
                }
            }

            const execResult = await exec.run(runtime, values, runOptions);
            if (
                this.step.path !== 'start' &&
                this.step.path !== 'stop' &&
                this.step.path !== 'request'
            ) {
                this.instance.status = this.mapToInstanceStatus(execResult);
                if (execResult.message) this.instance.message = execResult.message;
            }

            if (!execResult.message && this.instance.message) {
                execResult.message = this.instance.message;
            }

            this.instance.end = new Date();

            if (!runOptions?.submit && !runOptions?.createExpected) {
                await this.padActualStart(this.name, instNum);
            }

            result = {
                name: this.stepName,
                status: execResult.status,
                message: execResult.message || ''
            };
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

        // append status, result and message to actual result
        if (this.instance.end) {
            const elapsed = this.instance.end.getTime() - this.instance.start.getTime();
            runtime.appendResult(
                `status: ${this.instance.status}`,
                level + 1,
                runOptions?.createExpected,
                `${elapsed} ms`
            );

            if (typeof stepRes === 'boolean' || typeof stepRes === 'number' || stepRes) {
                this.instance.result = '' + stepRes;
                runtime.appendResult(
                    `result: ${this.instance.result}`,
                    level + 1,
                    runOptions?.createExpected
                );
            }
            if (this.instance.message) {
                runtime.appendResult(
                    `message: '${this.instance.message}'`,
                    level + 1,
                    runOptions?.createExpected
                );
            }
        }

        return result;
    }

    private mapToInstanceStatus(execResult: ExecResult): FlowElementStatus {
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
