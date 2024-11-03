import * as process from 'process';
import * as path from 'path';
import { ExecContext } from './context';
import { StepExec } from './exec';
import { RequestExec } from './request';
import { StartExec } from './start';
import { StopExec } from './stop';
import { DecideExec } from './decide';
import { DelayExec } from './delay';
import { ValueExec } from './value';
import { SubflowExec } from './subflow';
import { WebsocketExec } from './websocket';
import { LogExec } from './log';
import { SyncExec } from './sync';
import { LegacyExec } from './legacy';

export class ExecFactory {
    static async create(context: ExecContext): Promise<StepExec> {
        const step = context.step;
        if (step.path === 'start') return new StartExec();
        else if (step.path === 'stop') return new StopExec();
        else if (step.path === 'request') return new RequestExec();
        else if (step.path === 'decide') return new DecideExec();
        else if (step.path === 'delay') return new DelayExec();
        else if (step.path === 'log') return new LogExec();
        else if (step.path === 'value') return new ValueExec();
        else if (step.path === 'subflow') return new SubflowExec();
        else if (step.path === 'websocket') return new WebsocketExec();
        else if (step.path === 'sync') return new SyncExec();
        else if (step.path === 'typescript' || step.path.endsWith('.ts')) {
            const type = step.path === 'typescript' ? 'TypeScript' : 'Custom';
            let tsFile: string;
            if (type === 'TypeScript') {
                if (!step.attributes?.tsFile) {
                    throw new Error(`Step ${step.id} missing attribute: tsFile`);
                }
                tsFile = step.attributes.tsFile;
            } else {
                tsFile = step.path;
            }
            if (context.runOptions?.stepsBase) {
                tsFile = `${context.runOptions.stepsBase}/${tsFile}`;
            }

            if (!path.isAbsolute(tsFile)) tsFile = path.join(process.cwd(), tsFile);
            tsFile = path.normalize(tsFile);
            const mod = await import(tsFile);
            if (typeof mod.default !== 'function') {
                throw new Error(
                    `${type} step module must export PlyExec implementor class as default: ${tsFile}`
                );
            }

            let exec: StepExec;
            if (mod.default.legacy) {
                exec = new LegacyExec(new mod.default(step, context.stepInstance, context.logger));
            } else {
                exec = new mod.default();
            }

            if (typeof exec.run !== 'function') {
                throw new Error(`${type} step module must implement run() method: ${tsFile}`);
            }
            return exec;
        }
        throw new Error(`Unsupported step: ${step.path}`);
    }
}
