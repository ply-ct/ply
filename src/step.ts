import * as flowbee from 'flowbee';
import { Logger } from './logger';
import { RunOptions } from './options';
import { Request, PlyRequest } from './request';
import { Result } from './result';
import { Runtime } from './runtime';
import { Suite } from './suite';
import * as subst from './subst';

export interface Step {
    step: flowbee.Step;
    instance: flowbee.StepInstance;
}

export class PlyStep implements Step {

    readonly instance: flowbee.StepInstance;

    constructor(
        readonly step: flowbee.Step,
        readonly requestSuite: Suite<Request>,
        flowInstanceId: string,
        readonly logger: Logger
    ) {
        this.instance = {
            id: Date.now().toString(16),
            flowInstanceId,
            stepId: step.id,
            status: 'In Progress',
            start: new Date()
        };
    }

    async exec(runtime: Runtime, runOptions?: RunOptions): Promise<Result | void> {
        if (this.step.path === 'start') {
            this.logger.info('Starting flow', this.requestSuite.name);
        } else if (this.step.path === 'stop') {
            this.logger.info('Finished flow', this.requestSuite.name);
        } else if (this.step.path === 'request.ts') {
            let url = this.step.attributes?.url;
            if (!url) throw new Error('Missing attribute: url');
            url = subst.replace(url, runtime.values, this.logger);
            let method = this.step.attributes?.method;
            if (!method) throw new Error('Missing attribute: method');
            method = subst.replace(method, runtime.values, this.logger);
            const headers = this.step.attributes?.headers ? JSON.parse(this.step.attributes?.headers) : {};
            for (const key of Object.keys(headers)) {
                headers[key] = subst.replace(headers[key], runtime.values, this.logger);
            }
            let body = this.step.attributes?.body;
            if (body) {
                body = subst.replace(body, runtime.values, this.logger);
            }

            const requestObj: Request = {
                name: this.step.name,
                type: 'request',
                url,
                method,
                headers,
                body,
                submitted: new Date(),
                submit: (_values: object) => { throw new Error('Not implemented'); }
            };

            const request = new PlyRequest(this.step.name, requestObj, this.logger, runtime.retrieval);
            if (request.isGraphQl) {
                request.graphQl = body;
                body = JSON.stringify({ query: body }, null, runtime.options?.prettyIndent);
            }

            this.requestSuite.tests[this.step.name] = request;

            return await this.requestSuite.run(this.step.name, runtime.values, runOptions);
        }
    }
}