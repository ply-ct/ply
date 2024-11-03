import { PlyExecBase } from '../../../src/exec/legacy';
import { Step, StepInstance } from '../../../src/flowbee';
import { Runtime } from '../../../src/runtime';
import { Values } from '../../../src/values';
import { Log } from '../../../src/log';
import { ExecResult } from '../../../src/exec/exec';

export default class Legacy extends PlyExecBase {
    constructor(readonly step: Step, readonly instance: StepInstance, readonly logger: Log) {
        super(step, instance, logger);
    }

    async run(runtime: Runtime, values: Values): Promise<ExecResult> {
        const name = values.name || 'World';
        this.logger.info(`Hello, ${name} from step ${this.step.name} in flow ${runtime.suitePath}`);
        return { status: 'Passed' };
    }
}
