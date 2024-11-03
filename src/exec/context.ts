import { Flow, FlowInstance, Subflow, Step, StepInstance } from '../flowbee';
import { RunOptions } from '../options';
import { Values } from '../values';
import { Runtime } from '../runtime';
import { Log } from '../log';
import { Suite } from '../suite';
import { Request } from '../request';
import { Outcome, ResultData } from '../result';

export interface ExecContext {
    name: string;
    runtime: Runtime;
    flow: Flow;
    flowInstance: FlowInstance;
    subflow?: Subflow;
    step: Step;
    stepInstance: StepInstance;
    logger: Log;
    values: Values;
    runOptions?: RunOptions;
    requestSuite?: Suite<Request>; // unique

    runNum?: number;
    instNum?: number;

    evaluateToString(expr: string): string;

    /**
     * Return an attribute values, evaluating expressions
     */
    getAttribute(name: string, options?: { required?: boolean }): string | undefined;

    verifyData(data: ResultData): Promise<Outcome>;

    /**
     * Tagged logging at info level
     */
    logInfo(message: string, obj?: any): void;
    /**
     * Tagged logging at error level
     */
    logError(message: string, obj?: any): void;
    /**
     * Tagged logging at debug level
     */
    logDebug(message: string, obj?: any): void;
}
