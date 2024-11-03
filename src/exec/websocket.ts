import { StepExec, ExecResult } from './exec';
import { ExecContext } from './context';
import WebSocket from 'ws';

export class WebsocketExec extends StepExec {
    async run(context: ExecContext): Promise<ExecResult> {
        const url = context.getAttribute('url', { required: true })!;
        const timeout = context.getAttribute('timeout') || '0';
        const ms = Number(timeout);
        if (isNaN(ms)) {
            return { status: 'Errored', message: `Bad value for 'timeout': ${timeout}` };
        }

        // TODO: handle headers

        const message = context.getAttribute('message');

        context.logInfo(`WebSocket connecting to ${url}`);
        const ws = new WebSocket(url);

        const wsPromise = new Promise<ExecResult>((resolve, reject) => {
            ws.on('error', reject);
            ws.on('open', () => {
                if (message) {
                    ws.send(message);
                }
            });
            ws.on('message', async (data) => {
                ws.close();
                const outcome = await context.verifyData(data);
                resolve(outcome);
            });
            ws.on('close', () => {
                resolve({ status: 'Errored', message: 'WebSocket closed' });
            });
        });

        const timeoutPromise = new Promise<ExecResult>((resolve) => {
            setTimeout(() => {
                ws.close();
                resolve({ status: 'Errored', message: 'Timeout' });
            }, ms);
        });

        return await Promise.race([wsPromise, timeoutPromise]);
    }
}
