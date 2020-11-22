import * as flowbee from 'flowbee';
import { Logger } from './logger';
import { RunOptions } from './options';
import { Request, PlyRequest } from './request';
import { Runtime } from './runtime';
import { Suite } from './suite';
import * as subst from './subst';
import * as util from './util';
import { Storage } from './storage';

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
            id: Date.now().toString(16),
            flowInstanceId,
            stepId: step.id,
            status: 'In Progress'
        };
    }

    async exec(runtime: Runtime, runOptions?: RunOptions): Promise<void> {
        this.instance.start = new Date();
        let res: any;
        const actual = this.requestSuite.runtime.results.actual;
        try {
            if (this.step.path === 'start') {
                actual.remove();
            }
            actual.append(`${this.name}:  # ${util.timestamp(this.instance.start)}\n`);
            if (this.step.path === 'stop') {
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

            // append status, result and message to actual result
            const indent = this.requestSuite.runtime.options.prettyIndent;
            const statusLine = `status: ${this.instance.status}`;
            actual.append(statusLine.padStart(statusLine.length + indent));
            this.instance.end = new Date();
            const elapsed = this.instance.end.getTime() - this.instance.start.getTime();
            actual.append(`  # ${elapsed} ms\n`);

            if (typeof res === 'boolean' || typeof res === 'number' || res) {
                this.instance.result = '' + res;
                const resultLine = `result: ${this.instance.result}\n`;
                actual.append(resultLine.padStart(resultLine.length + indent));
            }
            if (this.instance.message) {
                const messageLine = `message: '${this.instance.message}'\n`;
                actual.append(messageLine.padStart(messageLine.length + indent));
            }

            await this.handleResult(runOptions);

        } catch (err) {
            this.instance.status = 'Errored';
            this.instance.message = err.message;
        }
    }

    /**
     * Handles step instance result.
     */
    async handleResult(runOptions?: RunOptions) {
        const results = this.requestSuite.runtime.results;
        if (runOptions?.createExpected && this.step.path === 'start') {
            results.expected.remove();
        }
        const expectedExists = await this.requestSuite.runtime.results.expectedExists(this.name);
        let actualYaml = this.requestSuite.runtime.results.getActualYaml(this.name);

        if (runOptions?.submit || (!expectedExists && runOptions?.submitIfExpectedMissing)) {
            this.requestSuite.logOutcome(
                { name: this.name, type: 'flow' },
                { status: 'Submitted', message: this.instance.message || '', start: this.instance.start?.getTime() },
                'Step'
            );
        } else if (runOptions?.createExpected || (!expectedExists && runOptions?.createExpectedIfMissing)) {
            if (this.requestSuite.runtime.results.expected.location.isUrl) {
                throw new Error('Run option createExpected not supported for remote results');
            }
            const expected = new Storage(this.requestSuite.runtime.results.expected.location.toString());
            if (this.step.path === 'start') {
                this.logger.info(`Creating expected result: ${expected}`);
                expected.write(actualYaml.text);
            } else if (this.step.path === 'request') {
                // request already written -- just append step info
                const indent = this.requestSuite.runtime.options.prettyIndent;
                const statusLine = `status: ${this.instance.status}\n`;
                expected.append(statusLine.padStart(statusLine.length + indent));
                if (this.instance.result) {
                    const resultLine = `result: ${this.instance.result}\n`;
                    expected.append(resultLine.padStart(resultLine.length + indent));
                }
                if (this.instance.message) {
                    const messageLine = `message: ${this.instance.message}\n`;
                    expected.append(messageLine.padStart(messageLine.length + indent));
                }
            } else {
                expected.append(actualYaml.text);
            }
        } else {
            const expectedYaml = await this.requestSuite.runtime.results.getExpectedYaml(this.name);
            if (expectedYaml.start > 0) {
                actualYaml = this.requestSuite.runtime.results.getActualYaml(this.name);
                if (expectedYaml.start > actualYaml.start) {
                    this.requestSuite.runtime.results.actual.padLines(actualYaml.start, expectedYaml.start - actualYaml.start);
                }
            }
        }
    }
}