import { StepExec, ExecResult } from './exec';
import { ExecContext } from './context';
import { Values } from '../values';
import { Request, PlyRequest } from '../request';
import { replace } from '../replace';

export class RequestExec extends StepExec {
    async run(context: ExecContext): Promise<ExecResult> {
        const url = context.getAttribute('url', { required: true });
        const method = context.getAttribute('method', { required: true });
        const headers: { [key: string]: string } = {};
        if (context.step.attributes?.headers) {
            const rows = JSON.parse(context.step.attributes.headers);
            for (const row of rows) {
                headers[row[0]] = replace(row[1], context.values, {
                    logger: context.logger,
                    trusted: context.runOptions?.trusted
                });
            }
        }
        let body = context.getAttribute('body');

        const requestObj: Request = {
            name: context.name,
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

        const request = new PlyRequest(
            context.name,
            requestObj,
            context.logger,
            context.runtime.retrieval
        );
        if (request.isGraphQl) {
            request.graphQl = body;
            body = JSON.stringify({ query: body }, null, context.runtime.options?.prettyIndent);
        }
        (request as any).stepName = context.step.name.replace(/\r?\n/g, ' ');

        context.stepInstance.data = {
            request: request.getRequest(context.values, context.runtime.options)
        };

        if (context.step.attributes?.submit === 'true') {
            const response = await request.submit(context.values, context.runtime.options, {
                ...context.runOptions,
                submit: true
            });
            context.stepInstance.data.response = response;
        } else {
            if (!context.requestSuite) {
                throw new Error(`Request suite not found for request: ${context.name}`);
            }
            context.requestSuite.tests[context.name] = request;
            const result = await context.requestSuite.run(
                context.name,
                context.values,
                context.runOptions,
                context.runNum,
                context.instNum
            );
            if (result.status !== 'Passed' && result.status !== 'Submitted') {
                context.stepInstance.status = result.status === 'Failed' ? 'Failed' : 'Errored';
                context.stepInstance.message = result.message;
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
                            context.runtime.options.prettyIndent
                        )
                    };
                }
                context.stepInstance.data.response = response;
            }
        }

        if (context.stepInstance.status === 'In Progress') {
            // not overwritten by step execution
            context.stepInstance.status = 'Completed';
        }

        return this.mapToExecResult(context.stepInstance, context.runOptions);
    }

    isTrustRequired(): boolean {
        return false; // expected results eval can work without trust
    }
}
