import { TestType, Test, PlyTest } from './test';
import { Logger } from './logger';
import { Runtime } from './runtime';

export interface Case extends Test {
    readonly method: string;
}

export class PlyCase implements Case, PlyTest {
    type = 'case' as TestType;

    constructor(
        readonly name: string,
        readonly method: string,
        readonly start: number,
        readonly end: number,
        readonly logger: Logger) {
    }

    /**
     * Only to be called in the context of a Suite (hence 'runtime').
     * To execute a test programmatically, call one of the Suite.run() overloads.
     * Or to send a request without testing, call submit().
     * @returns result with request outcomes and status of 'Pending'
     */
    async run(runtime: Runtime): Promise<void> {
        const decoratedSuite = runtime.decoratedSuite;
        if (!decoratedSuite) {
            throw new Error(`Missing decorators for suite '${runtime.suitePath}'`);
        }

        this.logger.info(`Running '${this.name}'`);
        await decoratedSuite.runBefores(this.name, runtime.values);

        const method = decoratedSuite.instance[this.method];
        if (!method) {
            throw new Error(`Case method ${this.method} not found in suite class ${runtime.retrieval.location}`);
        }
        await method.call(decoratedSuite.instance, runtime.values);

        await decoratedSuite.runAfters(this.name, runtime.values);
    }
}