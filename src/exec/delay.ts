import { Values } from '../values';
import { Step, StepInstance } from '../flowbee';
import { ExecResult, PlyExecBase } from './exec';
import { Runtime } from '../runtime';
import { Log } from '../log';

export class DelayExec extends PlyExecBase {
    constructor(readonly step: Step, readonly instance: StepInstance, readonly logger: Log) {
        super(step, instance, logger);
    }

    async run(_runtime: Runtime, values: Values): Promise<ExecResult> {
        let interval = this.step.attributes?.interval;
        if (interval) {
            if (this.isExpression(interval)) {
                interval = this.evaluateToString(interval, values);
            }
            const ms = Number(interval);
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
        this.logDebug(`Delaying ${ms} ms`);
        return new Promise((resolve) => {
            setTimeout(() => {
                resolve();
            }, ms);
        });
    }

    isTrustRequired() {
        return this.isExpression(this.step.attributes?.interval || '');
    }
}
