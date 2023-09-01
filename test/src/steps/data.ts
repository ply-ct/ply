import { Step, StepInstance } from '../../../src/flowbee';
import { ExecResult, PlyExecBase } from '../../../src/exec/exec';
import { Log } from '../../../src/log';
import { Runtime } from '../../../src/runtime';
import { Values } from '../../../src/values';
import { RunOptions } from '../../../src/options';

export default class DataStep extends PlyExecBase {
    constructor(readonly step: Step, readonly instance: StepInstance, readonly logger: Log) {
        super(step, instance, logger);
    }

    async run(runtime: Runtime, values: Values, runOptions?: RunOptions): Promise<ExecResult> {
        const data = {
            title: 'Dracula',
            year: 1931,
            id: '269b34c1',
            poster: 'drac.jpg',
            rating: 5,
            webRef: {
                ref: 'tt0021814',
                site: 'imdb.com'
            }
        };

        return await this.verifyData(runtime, data, values, runOptions);
    }
}
