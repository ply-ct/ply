import { minimatch } from 'minimatch';
import { Values } from './values';
import * as flowbee from './flowbee';
import { Listener, TypedEvent } from './event';
import { Log, LogLevel } from './log';
import { RunOptions } from './options';
import { Runtime } from './runtime';
import { PlyStep } from './step';
import { Suite } from './suite';
import { Request } from './request';
import { Result } from './result';
import { RUN_ID } from './names';
import * as util from './util';
import { replaceLine } from './replace';
import { RESULTS } from './names';

export interface Flow {
    flow: flowbee.Flow;
    instance: flowbee.FlowInstance;
}
export interface Subflow {
    subflow: flowbee.Subflow;
    instance: flowbee.SubflowInstance;
}
export interface FlowResult extends Result {
    /**
     * flow path
     */
    flow: string;
    /**
     * return values
     */
    return?: Values;
}

export class FlowStepResults {
    private results: (Result & { stepId: string })[] = [];

    constructor(readonly flow: string) {}

    add(stepId: string, result: Result) {
        this.results.push({ ...result, stepId });
    }

    get latest(): Result {
        if (this.results.length > 0) {
            return this.results[this.results.length - 1];
        } else {
            return { name: this.flow, status: 'Pending', message: '' };
        }
    }

    latestBad(): boolean {
        return this.latest.status === 'Failed' || this.latest.status === 'Errored';
    }

    get overall(): Result {
        let anySubmitted = false;
        for (const result of this.results) {
            if (result.status === 'Failed' || result.status === 'Errored') {
                return result;
            } else if (result.status === 'Submitted') {
                anySubmitted = true;
            }
        }
        return {
            name: this.flow,
            status: anySubmitted ? 'Submitted' : 'Passed',
            message: ''
        };
    }

    /**
     * Step result values
     */
    get values(): Values {
        return this.results.reduce((values, result) => {
            if (result.data) {
                let data = result.data;
                if (typeof data === 'object') {
                    data = { ...data }; // clone array or object
                }
                let plyResults = values[RESULTS];
                if (!plyResults) {
                    plyResults = {};
                    values[RESULTS] = plyResults;
                }
                let stepResult = plyResults[result.stepId];
                if (!stepResult) {
                    stepResult = {};
                    plyResults[result.stepId] = stepResult;
                }
                if (typeof data === 'object' && !Array.isArray(data)) {
                    if (data.request) {
                        stepResult.request = data.request;
                        if (typeof stepResult.request.body === 'string' && util.isJson(stepResult.request.body)) {
                            stepResult.request.body = JSON.parse(stepResult.request.body);
                        }
                    }
                    if (data.response) {
                        stepResult.response = data.response;
                        if (typeof stepResult.response.body === 'string' && util.isJson(stepResult.response.body)) {
                            stepResult.response.body = JSON.parse(stepResult.response.body);
                        }
                    }
                } else {
                    stepResult.data = data;
                }
            }

            return values;
        }, {} as Values);
    }
}

export class PlyFlow implements Flow {
    readonly name: string;
    readonly type = 'flow';
    start = 0;
    end?: number | undefined;
    instance: flowbee.FlowInstance;
    results: FlowStepResults;
    maxLoops = 0;

    private _onFlow = new TypedEvent<flowbee.FlowEvent>();
    onFlow(listener: Listener<flowbee.FlowEvent>) {
        this._onFlow.on(listener);
    }

    constructor(
        readonly flow: flowbee.Flow,
        readonly requestSuite: Suite<Request>,
        private readonly logger: Log
    ) {
        this.name = flowbee.getFlowName(flow);
        this.instance = this.newInstance();
        this.results = new FlowStepResults(this.name);
    }

    clone(): PlyFlow {
        return new PlyFlow(this.flow, this.requestSuite, this.logger);
    }

    newInstance() {
        const id = util.genId();
        this.instance = {
            id,
            runId: id,
            flowPath: this.flow.path,
            status: 'Pending'
        };
        return this.instance;
    }

    valuesFromAttribute(): Values {
        const values: Values = {};
        if (this.flow.attributes?.values) {
            const rows = JSON.parse(this.flow.attributes.values);
            for (const row of rows) {
                let rowVal: any = row[1];
                if (('' + rowVal).trim() === '') {
                    rowVal = undefined; // empty string
                } else {
                    const numVal = Number(row[1]);
                    if (!isNaN(numVal)) rowVal = numVal;
                    else if (row[1] === 'true' || row[1] === 'false') rowVal = row[1] === 'true';
                    else if (util.isJson(row[1])) rowVal = JSON.parse(row[1]);
                }
                values[row[0]] = rowVal;
            }
        }
        return values;
    }

    returnValues(values: Values, trusted = false): Values | undefined {
        if (this.flow.attributes?.return) {
            const rows = JSON.parse(this.flow.attributes.return);
            const returnVals: Values = {};
            for (const row of rows) {
                const expr = row[1];
                const val = replaceLine(expr, values, { trusted, logger: this.logger });
                if (val.trim().length) {
                    returnVals[row[0]] = val;
                }
            }
            return returnVals;
        }
    }

    /**
     * Run a ply flow.
     */
    async run(
        runtime: Runtime,
        values: Values,
        runOptions?: RunOptions,
        runNum?: number
    ): Promise<Result> {
        this.newInstance();
        this.results = new FlowStepResults(this.name);
        values[RUN_ID] = this.instance.runId || util.genId();

        // flow values supersede file-based
        const flowValues = this.valuesFromAttribute();
        for (const flowValKey of Object.keys(flowValues)) {
            values[flowValKey] = flowValues[flowValKey];
        }
        // run values override even flow-configured vals
        if (runOptions?.values) {
            values = { ...values, ...runOptions.values };
        }

        this.maxLoops = runtime.options.maxLoops || 10;
        if (this.flow.attributes?.maxLoops) {
            this.maxLoops = parseInt(this.flow.attributes.maxLoops);
        }

        if (this.flow.attributes?.bail === 'true') {
            runtime.options.bail = true;
        }

        runtime.results.actual.write('');
        const expectedExists = await this.requestSuite.runtime.results.expectedExists();
        if (!expectedExists && runOptions?.submitIfExpectedMissing) {
            runOptions.submit = true;
        }
        if (
            runOptions?.createExpected ||
            (!expectedExists && runOptions?.createExpectedIfMissing)
        ) {
            this.logger.info(`Creating expected result: ${runtime.results.expected}`);
            runtime.results.expected.write('');
            runOptions.createExpected = true;
        }

        const runId = this.logger.level === LogLevel.debug ? ` (${this.instance.runId})` : '';
        this.logger.info(`Running flow '${this.name}'${runId}`);
        this.instance.status = 'In Progress';
        this.instance.values = values as flowbee.Values;
        this.instance.start = new Date();
        this.emit('start', 'flow', this.instance);

        await this.runSubflows(this.getSubflows('Before'), runtime, values, runOptions, runNum);
        if (this.results.latestBad() && runtime.options.bail) {
            return this.endFlow();
        }

        const startStep = this.flow.steps?.find((s) => s.path === 'start');
        if (!startStep) {
            throw new Error(`Cannot find start step in flow: ${this.flow.path}`);
        }

        await this.exec(startStep, runtime, values, runOptions, runNum);
        if (this.results.latestBad() && runtime.options.bail) {
            return this.endFlow();
        }

        await this.runSubflows(this.getSubflows('After'), runtime, values, runOptions, runNum);

        return this.endFlow();
    }

    private endFlow(): Result {
        this.instance.end = new Date();
        if (this.instance.status === 'Errored' || this.instance.status === 'Failed') {
            this.emit('error', 'flow', this.instance);
        } else {
            this.instance.status = 'Completed';
            this.emit('finish', 'flow', this.instance);
        }
        return this.results.overall;
    }

    /**
     * Executes a step within a flow and recursively executes the following step(s).
     */
    async exec(
        step: flowbee.Step,
        runtime: Runtime,
        values: Values,
        runOptions?: RunOptions,
        runNum?: number,
        subflow?: Subflow
    ) {
        await this.runSubflows(
            this.getSubflows('Before', step),
            runtime,
            values,
            runOptions,
            runNum
        );
        if (this.results.latestBad() && runtime.options.bail) {
            return;
        }

        let insts = 0;
        if (this.instance.stepInstances && !runtime.options.parallel) {
            insts = this.instance.stepInstances.filter((si) => si.stepId === step.id)?.length;
        }
        const plyStep = new PlyStep(
            step,
            this.requestSuite,
            this.logger,
            this.flow.path,
            this.instance.id,
            subflow?.subflow
        );

        if (insts) {
            let maxLoops = this.maxLoops;
            if (step.path === 'start') maxLoops = 1;
            if (step.attributes?.maxLoops) {
                maxLoops = parseInt(step.attributes.maxLoops);
            }
            if (isNaN(maxLoops)) this.stepError(plyStep, `Invalid maxLoops: ${maxLoops}`);
            else if (insts + 1 > maxLoops) {
                this.stepError(plyStep, `Max loops (${maxLoops} reached for step: ${step.id}`);
            }
        }

        if (subflow) {
            if (!subflow.instance.stepInstances) {
                subflow.instance.stepInstances = [];
            }
            subflow.instance.stepInstances.push(plyStep.instance);
        } else {
            if (!this.instance.stepInstances) {
                this.instance.stepInstances = [];
            }
            this.instance.stepInstances.push(plyStep.instance);
        }
        this.emit('start', 'step', plyStep.instance);

        this.logger.info('Executing step', plyStep.name);
        this.emit('exec', 'step', plyStep.instance);

        const result = await plyStep.run(runtime, values, runOptions, runNum, insts);
        result.start = plyStep.instance.start?.getTime();
        result.end = plyStep.instance.end?.getTime();
        result.data = plyStep.instance.data;
        this.results.add(plyStep.name, result);
        this.requestSuite.logOutcome(plyStep, result, runNum, plyStep.stepName);

        if (this.results.latestBad()) {
            this.instance.status = plyStep.instance.status;
            if (subflow) subflow.instance.status = plyStep.instance.status;
            this.emit('error', 'step', plyStep.instance);
            if (result.status === 'Errored' || runtime.options.bail) {
                return;
            }
        } else {
            this.emit('finish', 'step', plyStep.instance);
        }

        await this.runSubflows(
            this.getSubflows('After', step),
            runtime,
            values,
            runOptions,
            runNum
        );
        if (this.results.latestBad() && runtime.options.bail) {
            return;
        }

        const outSteps: flowbee.Step[] = [];
        if (step.links) {
            for (const link of step.links) {
                const result = plyStep.instance.result?.trim();
                if ((!result && !link.result) || result === link.result) {
                    let outStep: flowbee.Step | undefined;
                    if (subflow) {
                        outStep = subflow.subflow.steps?.find((s) => s.id === link.to);
                    } else {
                        outStep = this.flow.steps?.find((s) => s.id === link.to);
                    }
                    if (outStep) {
                        outSteps.push(outStep);
                    } else {
                        this.stepError(
                            plyStep,
                            `No such step: ${link.to} (linked from ${link.id})`
                        );
                    }
                }
            }
        }
        if (outSteps.length === 0 && step.path !== 'stop') {
            this.stepError(
                plyStep,
                `No outbound link from step ${step.id} matches result: ${plyStep.instance.result}`
            );
        }

        // steps can execute in parallel
        await Promise.all(
            outSteps.map((outStep) =>
                this.exec(outStep, runtime, values, runOptions, runNum, subflow)
            )
        );
    }

    getSubflows(type: 'Before' | 'After', step?: flowbee.Step): Subflow[] {
        const subflows =
            this.flow.subflows?.filter((sub) => {
                if (sub.attributes?.when === type) {
                    const steps = sub.attributes?.steps;
                    if (step) {
                        return steps ? minimatch(step.name, steps) : false;
                    } else {
                        return !steps;
                    }
                }
            }) || [];
        const flowInstanceId = this.instance.id;
        return subflows.map((subflow) => {
            return {
                subflow,
                instance: {
                    id: Date.now().toString(16),
                    flowInstanceId,
                    subflowId: subflow.id,
                    runId: Date.now().toString(16),
                    flowPath: this.flow.path,
                    status: 'Pending'
                }
            };
        });
    }

    async runSubflows(
        subflows: Subflow[],
        runtime: Runtime,
        values: Values,
        runOptions?: RunOptions,
        runNum?: number
    ) {
        for (const subflow of subflows) {
            const startStep = subflow.subflow.steps?.find((s) => s.path === 'start');
            if (!startStep) {
                throw new Error(`Cannot find start step in subflow: ${subflow.subflow.id}`);
            }
            subflow.instance.status = 'In Progress';
            subflow.instance.start = new Date();
            if (!this.instance.subflowInstances) {
                this.instance.subflowInstances = [];
            }
            this.instance.subflowInstances.push(subflow.instance);

            this.emit('start', 'subflow', subflow.instance);
            this.logger.info('Executing subflow', subflow.subflow.name);
            runtime.appendResult(
                `${subflow.subflow.name}:`,
                0,
                runOptions?.createExpected,
                util.timestamp(subflow.instance.start)
            );
            runtime.appendResult(`id: ${subflow.subflow.id}`, 1, runOptions?.createExpected);
            await this.exec(startStep, runtime, values, runOptions, runNum, subflow);
            subflow.instance.end = new Date();
            const elapsed = subflow.instance.end.getTime() - subflow.instance.start.getTime();
            if (this.results.latestBad()) {
                subflow.instance.status =
                    this.results.latest.status === 'Errored' ? 'Errored' : 'Failed';
                runtime.appendResult(
                    `status: ${subflow.instance.status}`,
                    1,
                    runOptions?.createExpected,
                    `${elapsed} ms`
                );
                this.emit('error', 'subflow', subflow.instance);
                if (runtime.options.bail) {
                    return;
                }
            } else {
                subflow.instance.status = 'Completed';
                runtime.appendResult(
                    `status: ${subflow.instance.status}`,
                    1,
                    runOptions?.createExpected,
                    `${elapsed} ms`
                );
                this.emit('finish', 'subflow', subflow.instance);
            }
        }
    }

    stepError(plyStep: PlyStep, message: string) {
        plyStep.instance.status = 'Errored';
        plyStep.instance.message = message;
        this.emit('error', 'step', plyStep.instance);
        this.emit('error', 'flow', this.instance);
        throw new Error(message);
    }

    flowEvent(
        eventType: flowbee.FlowEventType,
        elementType: flowbee.FlowElementType,
        instance: flowbee.FlowInstance | flowbee.SubflowInstance | flowbee.StepInstance
    ): flowbee.FlowEvent {
        return {
            eventType,
            elementType,
            flowPath: this.flow.path,
            flowInstanceId: this.instance.id,
            instance
        };
    }

    private emit(
        eventType: flowbee.FlowEventType,
        elementType: flowbee.FlowElementType,
        instance: flowbee.FlowInstance | flowbee.SubflowInstance | flowbee.StepInstance
    ) {
        this._onFlow.emit(this.flowEvent(eventType, elementType, instance));
    }
}
