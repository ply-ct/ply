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

        // const injector = new Injector(cls);
        // const inst = injector.create();

        // const meth = "retrieveMovie";

        // console.log("INST[meth]: " + inst[meth]);

        // const before = inst['before'];
        // if (before) {
        //     before.call(inst);
        // }

        // let method = inst[meth];
        // // inst[meth] = inst[meth].bind(inst);


        // Promise.resolve(method.call(inst, values))
        //     .then(x => {
        //         console.log("X: " + x);
        //     })
        //     .catch(err => {
        //         console.log(err);
        //         throw err;
        //     });


        // let cls: any = constructor;
        // let inst = new cls();
    }
}