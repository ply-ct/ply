import { Values } from '../values';
import { Step, StepInstance } from '../flowbee';
import { ExecResult, PlyExecBase } from './exec';
import { Suite } from '../suite';
import { Request, PlyRequest } from '../request';
import { Runtime } from '../runtime';
import { RunOptions } from '../options';
import { Log } from '../log';
import { replace } from '../replace';
import * as yaml from '../yaml';

export class RequestExec extends PlyExecBase {
    constructor(
        private readonly name: string, // unique
        private readonly requestSuite: Suite<Request>, // unique
        readonly step: Step,
        readonly instance: StepInstance,
        readonly logger: Log,
        private readonly runNum?: number,
        private readonly instNum?: number
    ) {
        super(step, instance, logger);
    }

    async run(runtime: Runtime, values: Values, runOptions?: RunOptions): Promise<ExecResult> {
        const trusted = runOptions?.trusted;
        const url = this.getAttribute('url', values, { trusted, required: true });
        const method = this.getAttribute('method', values, { trusted, required: true });
        const headers: { [key: string]: string } = {};
        if (this.step.attributes?.headers) {
            const rows = JSON.parse(this.step.attributes.headers);
            for (const row of rows) {
                headers[row[0]] = replace(row[1], values, {
                    logger: this.logger,
                    trusted: runOptions?.trusted
                });
            }
        }
        let body = this.getAttribute('body', values, { trusted });

        const requestObj: Request = {
            name: this.name,
            type: 'request',
            url: url!, // required above
            method: method!, // required above
            headers,
            body,
            submitted: new Date(),
            submit: (_values: Values) => {
                throw new Error('Not implemented');
            }
        };

        const request = new PlyRequest(this.name, requestObj, this.logger, runtime.retrieval);
        if (request.isGraphQl) {
            request.graphQl = body;
            body = JSON.stringify({ query: body }, null, runtime.options?.prettyIndent);
        }
        (request as any).stepName = this.step.name.replace(/\r?\n/g, ' ');

        this.instance.data = {
            request: yaml.dump(
                request.getRequest(values, runtime.options),
                runtime.options.prettyIndent
            )
        };

        if (this.step.attributes?.submit === 'true') {
            const response = await request.submit(values, runtime.options, {
                ...runOptions,
                submit: true
            });
            this.instance.data.response = yaml.dump(response, runtime.options.prettyIndent);
        } else {
            this.requestSuite.tests[this.name] = request;
            const result = await this.requestSuite.run(
                this.name,
                values,
                runOptions,
                this.runNum,
                this.instNum
            );
            if (result.status !== 'Passed' && result.status !== 'Submitted') {
                this.instance.status = result.status === 'Failed' ? 'Failed' : 'Errored';
                this.instance.message = result.message;
            }
            if (result.response) {
                let response = result.response;
                if (result.response.body) {
                    // convert from object
                    response = {
                        ...result.response,
                        body: JSON.stringify(
                            result.response.body,
                            null,
                            runtime.options.prettyIndent
                        )
                    };
                }
                this.instance.data.response = yaml.dump(response, runtime.options.prettyIndent);
            }
        }

        if (this.instance.status === 'In Progress') {
            // not overwritten by step execution
            this.instance.status = 'Completed';
        }

        return this.mapToExecResult(this.instance, runOptions);
    }

    isTrustRequired(): boolean {
        return false; // expected results eval can work without trust
    }
}
