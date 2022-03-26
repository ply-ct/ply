import * as flowbee from 'flowbee';
import { ExecResult, PlyExecBase } from './exec';
import { Runtime } from '../runtime';
import { Logger } from '../logger';

export class DelayExec extends PlyExecBase {
    constructor(
        readonly step: flowbee.Step,
        readonly instance: flowbee.StepInstance,
        readonly logger: Logger
    ) {
        super(step, instance, logger);
    }

    async run(_runtime: Runtime, values: any): Promise<ExecResult> {
        let interval = this.step.attributes?.interval;
        if (interval) {
            if (interval.startsWith('${') && interval.endsWith('}')) {
                interval = this.evaluateToString(interval, values);
            }
            const ms = parseInt(interval);
            if (isNaN(ms)) {
                return { status: 'Errored', message: `Bad value for 'interval': ${interval}` };
            }
            await this.delay(ms);
            return { status: 'Passed' };
        } else {
            return { status: 'Errored', message: 'Missing attribute: interval' };
        }
    }

    private delay(ms: number): Promise<void> {
        return new Promise((resolve) => {
            setTimeout(() => {
                resolve();
            }, ms);
        });
    }
}
