import { Step, StepInstance } from '../../src/flowbee';
import { ExecResult, PlyExecBase } from '../../src/exec/exec';
import { Logger } from '../../src/logger';
import { Runtime } from '../../src/runtime';

export default class IncrementLoopCount extends PlyExecBase {
    constructor(readonly step: Step, readonly instance: StepInstance, readonly logger: Logger) {
        super(step, instance, logger);
    }

    async run(_runtime: Runtime, values: any): Promise<ExecResult> {
        values.loopCount += 1;
        return { status: 'Passed' };
    }
}
