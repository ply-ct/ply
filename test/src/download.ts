import { Step, StepInstance } from 'flowbee';
import ply from '../../src/index';
import { ExecResult, PlyExecBase } from '../../src/exec/exec';
import { Log } from '../../src/log';
import { Runtime } from '../../src/runtime';
import { uintArrayToBase64 } from '../../src/util';

export default class Download extends PlyExecBase {
    constructor(readonly step: Step, readonly instance: StepInstance, readonly logger: Log) {
        super(step, instance, logger);
    }

    async run(_runtime: Runtime, values: any): Promise<ExecResult> {
        const req = await ply.loadRequest('test/ply/requests/get-logo.ply');
        const resp = await req.submit(values, ply.options);
        const str = uintArrayToBase64(new Uint8Array(resp.body));
        if (str.startsWith('iVBOR')) {
            return { status: 'Passed' };
        } else {
            return { status: 'Failed', message: 'Unexpected stringified response body' };
        }
    }
}
