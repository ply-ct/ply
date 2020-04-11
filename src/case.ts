import { TestType, Test } from './test';
import { Runtime } from './runtime';
import { Result } from './result';

export interface Case extends Test {
    readonly suiteClass: string;
    readonly method: string;
}

export class PlyCase implements Case {
    type = 'case' as TestType;

    constructor(
        readonly name: string,
        readonly suiteClass: string,
        readonly method: string,
        readonly startLine?: number,
        readonly endLine?: number) {
    }

    async run(runtime: Runtime): Promise<Result> {
        runtime.logger.info(`Running '${this.name}'`);
        const testFile = runtime.testsLocation.toString() + '/' + runtime.suitePath;
        const mod = await import(testFile);
        const clsName = Object.keys(mod).find(key => key === this.suiteClass);
        if (!clsName) {
            throw new Error(`Suite class ${this.suiteClass} not found in ${testFile}`);
        }

        const inst = new mod[clsName]();


        const method = inst[this.method];
        if (!method) {
            throw new Error(`Case method ${this.method} not found in suite class ${runtime.retrieval.location}`);
        }

        await method.call(inst, runtime.values);

        return new Result();
    }
}