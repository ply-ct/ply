import * as flowbee from 'flowbee';
import { Logger } from './logger';
import { RunOptions } from './options';
import { Result } from './result';
import { Runtime } from './runtime';
import { PlyTest, Test } from './test';
import { PlyStep } from './step';
import { Suite } from './suite';
import { Request } from './request';

export interface Flow extends Test {
    flow: flowbee.Flow;
    instance: flowbee.FlowInstance;
}

export class PlyFlow implements Flow, PlyTest {
    readonly name: string;
    readonly type = 'flow';
    start = 0;
    end?: number | undefined;
    readonly instance: flowbee.FlowInstance;

    constructor(
        readonly flow: flowbee.Flow,
        private readonly requestSuite: Suite<Request>,
        private readonly logger: Logger
    ) {
        this.name = flowbee.getFlowName(flow);
        if (this.name.endsWith('.ply')) {
            this.name = this.name.substring(0, this.name.length - 4);
        }
        this.instance = {
            id: '',
            runId: Date.now().toString(16),
            flowPath: this.flow.path,
            status: 'Pending'
        };
    }

    async run(runtime: Runtime, runOptions?: RunOptions): Promise<Result> {
        this.logger.info(`Running '${this.name}'`);

        const startStep = this.flow.steps?.find(s => s.path === 'start');
        if (!startStep) {
            throw new Error(`Cannot find start step in flow: ${this.flow.path}`);
        }
        this.instance.status = 'In Progress';
        this.instance.values = runtime.values as flowbee.Values;
        this.instance.start = new Date();

        await this.exec(startStep, runtime, runOptions);

        this.instance.end = new Date();
        this.instance.status = 'Completed';

        return {
            name: this.name,
            status: 'Pending',
            message: ''
        };
    }

    async exec(step: flowbee.Step, runtime: Runtime, runOptions?: RunOptions): Promise<void> {

        const plyStep = new PlyStep(step, this.requestSuite, this.logger, this.instance.id);

        this.logger.info('Executing step', plyStep.name);

        if (!this.instance.stepInstances) {
            this.instance.stepInstances = [];
        }

        this.instance.stepInstances.push(plyStep.instance);

        await plyStep.exec(runtime, runOptions);
        if (plyStep.instance.status === 'Waiting' || (plyStep.instance.status !== 'Completed' && runtime.options.bail)) {
            return;
        }

        const outSteps: flowbee.Step[] = [];
        if (step.links) {
            for (const link of step.links) {
                const result = plyStep.instance.result?.trim();
                if ((!result && !link.result) || (result === link.result)) {
                    const outStep = this.flow.steps?.find(s => s.id === link.to);
                    if (!this.instance.linkInstances) {
                        this.instance.linkInstances = [];
                    }
                    this.instance.linkInstances.push({
                        id: Date.now().toString(16),
                        linkId: link.id,
                        flowInstanceId: this.instance.id,
                        status: 'Traversed'
                    });
                    if (!outStep) {
                        throw new Error(`No such step: ${link.to} (linked from ${link.id})`);
                    }
                    outSteps.push(outStep);
                }
            }
        }
        if (outSteps.length === 0 && step.path !== 'stop') {
            throw new Error(`No outbound link from step ${step.id} matches result: ${plyStep.instance.result}`);
        }

        await Promise.all(outSteps.map(outStep => this.exec(outStep, runtime, runOptions)));
    }

}