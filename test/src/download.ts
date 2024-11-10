import ply from '../../src/index';
import { ExecResult, StepExec } from '../../src/exec/exec';
import { ExecContext } from '../../src/exec/context';
import { uintArrayToBase64 } from '../../src/util';

export default class DataStep extends StepExec {
    async run(context: ExecContext): Promise<ExecResult> {
        const req = await ply.loadRequest('test/ply/requests/get-logo.ply');
        const resp = await req.submit(context.values, ply.options);
        const str = uintArrayToBase64(new Uint8Array(resp.body));
        if (str.startsWith('iVBOR')) {
            return { status: 'Passed' };
        } else {
            return { status: 'Failed', message: 'Unexpected stringified response body' };
        }
    }
}
