import { TestType, Test } from './test';
import { Runtime } from './runtime';
import { Result } from './result';

export interface Case extends Test {
    readonly method: string;
}

export class PlyCase implements Case {
    type = 'case' as TestType;

    constructor(
        readonly name: string,
        readonly method: string,
        readonly startLine?: number,
        readonly endLine?: number) {
    }

    async run(runtime: Runtime): Promise<Result> {
        const decoratedSuite = runtime.decoratedSuite;
        if (!decoratedSuite) {
            throw new Error(`Missing decorators for suite '${runtime.suitePath}'`);
        }

        runtime.logger.info(`Running '${this.name}'`);
        decoratedSuite.runBefores(this.name, runtime.values);


        const method = decoratedSuite.instance[this.method];
        if (!method) {
            throw new Error(`Case method ${this.method} not found in suite class ${runtime.retrieval.location}`);
        }
        await method.call(decoratedSuite.instance, runtime.values);

        decoratedSuite.runAfters(this.name, runtime.values);

        return new Result();
    }
}