import * as flowbee from 'flowbee';
import { Logger } from './logger';
import { RunOptions } from './options';
import { Request, PlyRequest } from './request';
import { Runtime } from './runtime';
import { Suite } from './suite';
import { Subflow } from './flow';
import * as subst from './subst';
import * as util from './util';

export interface Step {
    step: flowbee.Step;
    instance: flowbee.StepInstance;
}

export class PlyStep implements Step {

    readonly name: string;
    readonly instance: flowbee.StepInstance;

    constructor(
        readonly step: flowbee.Step,
        private readonly requestSuite: Suite<Request>,
        private readonly logger: Logger,
        flowInstanceId: string
    ) {
        this.name = step.name.replace(/\r?\n/g, ' ');
        this.instance = {
            id: util.genId(),
            flowInstanceId,
            stepId: step.id,
            status: 'In Progress'
        };
    }

    async exec(runtime: Runtime, runOptions?: RunOptions, subflow?: Subflow): Promise<void> {
        this.instance.start = new Date();
        let res: any;
        const level = subflow ? 1 : 0;
        try {
            runtime.appendResult(`${this.name}:`, level, runOptions?.createExpected, util.timestamp(this.instance.start));
            runtime.appendResult(`id: ${this.step.id}`, level + 1, runOptions?.createExpected);
            if (this.step.path === 'stop' && !subflow) {
                this.logger.info('Finished flow', this.requestSuite.name);
            } else if (this.step.path === 'request') {
                let url = this.step.attributes?.url;
                if (!url) throw new Error('Missing attribute: url');
                url = subst.replace(url, runtime.values, this.logger);
                let method = this.step.attributes?.method;
                if (!method) throw new Error('Missing attribute: method');
                method = subst.replace(method, runtime.values, this.logger);
                const headers: {[key: string]: string} = {};
                if (this.step.attributes?.headers) {
                    const rows = JSON.parse(this.step.attributes.headers);
                    for (const row of rows) {
                        headers[row[0]] = subst.replace(row[1], runtime.values, this.logger);
                    }
                }
                let body = this.step.attributes?.body;
                if (body) {
                    body = subst.replace(body, runtime.values, this.logger);
                }

                const requestObj: Request = {
                    name: this.name,
                    type: 'request',
                    url,
                    method,
                    headers,
                    body,
                    submitted: new Date(),
                    submit: (_values: object) => { throw new Error('Not implemented'); }
                };

                const request = new PlyRequest(this.name, requestObj, this.logger, runtime.retrieval);
                if (request.isGraphQl) {
                    request.graphQl = body;
                    body = JSON.stringify({ query: body }, null, runtime.options?.prettyIndent);
                }

                if (this.step.attributes?.submit === 'true') {
                    await request.submit(runtime.values, runtime.options, { ...runOptions, submit: true });
                } else {
                    this.requestSuite.tests[this.name] = request;
                    const result = await this.requestSuite.run(this.name, runtime.values, runOptions);
                    if (result.status !== 'Passed' && result.status !== 'Submitted') {
                        this.instance.status = result.status === 'Failed' ? 'Failed' : 'Errored';
                        this.instance.message = result.message;
                    }
                }
            }
            if (this.instance.status === 'In Progress') { // not overwritten by step execution
                this.instance.status = 'Completed';
            }

            this.instance.end = new Date();

            await this.handleResult(runtime, runOptions, subflow);

        } catch (err) {
            this.logger.error(err.message, err);
            this.instance.status = 'Errored';
            this.instance.message = err.message;
        }

        // append status, result and message to actual result
        if (this.instance.end) {
            const elapsed = this.instance.end.getTime() - this.instance.start.getTime();
            runtime.appendResult(`status: ${this.instance.status}`, level + 1, runOptions?.createExpected, `${elapsed} ms`);

            if (typeof res === 'boolean' || typeof res === 'number' || res) {
                this.instance.result = '' + res;
                runtime.appendResult(`result: ${this.instance.result}`, level + 1, runOptions?.createExpected);
            }
            if (this.instance.message) {
                runtime.appendResult(`message: '${this.instance.message}'`, level + 1, runOptions?.createExpected);
            }
        }
    }

    /**
     * Handles step instance result.
     */
    async handleResult(_runtime: Runtime, runOptions?: RunOptions, subflow?: Subflow) {
        const resName = subflow ? subflow?.subflow.name : this.name;
        const resSubName = subflow ? this.name : undefined;
        let actualYaml = this.requestSuite.runtime.results.getActualYaml(resName, resSubName);

        if (runOptions?.submit) {
            this.requestSuite.logOutcome(
                { name: this.name, type: 'flow' },
                { status: 'Submitted', message: this.instance.message || '', start: this.instance.start?.getTime() },
                'Step'
            );
        }
        else if (!runOptions?.createExpected) {
            const expectedYaml = await this.requestSuite.runtime.results.getExpectedYaml(resName, resSubName);
            if (expectedYaml.start > 0) {
                actualYaml = this.requestSuite.runtime.results.getActualYaml(resName, resSubName);
                if (expectedYaml.start > actualYaml.start) {
                    this.requestSuite.runtime.results.actual.padLines(actualYaml.start, expectedYaml.start - actualYaml.start);
                }
            }
        }
    }
}