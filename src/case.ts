import { TestType, Test } from './test';
import { Response } from './response';
import { Result } from './result';
import { Runtime } from './runtime';

export class Case implements Test {
    type = 'case' as TestType;

    constructor(readonly suitePath: string, readonly suiteClass: string,
        readonly name: string, readonly method: string, readonly startLine: number = 0, readonly endLine?: number) {
    }

    get path() {
        return this.suitePath + '#' + this.name;
    }

    async invoke(runtime: Runtime, values: object): Promise<Response> {
        const testFile = runtime.testsLocation.toString() + '/' + this.suitePath;
        const mod = await import(testFile);
        const clsName = Object.keys(mod).find(key => key === this.suiteClass);
        if (!clsName) {
            throw new Error(`Suite class ${this.suiteClass} not found in ${this.suitePath}`);
        }

        const inst = new mod[clsName]();
        const method = inst[this.method];
        if (!method) {
            throw new Error(`Case method ${this.method} not found in suite class ${this.suitePath}`);
        }

        await method.call(inst, values);

        // TODO probably don't need to return a response
        return new Response(
            { code: 200, message: 'ok' },
            { 'content-type': 'application/json' },
            '',
            0
        );

        // Promise.resolve(method.call(inst, values))
        // .then(x => {
        //     console.log("X: " + x);
        // })
        // .catch(err => {
        //     console.log(err);
        //     throw err;
        // });

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

    async run(runtime: Runtime, values: object): Promise<Result> {
        throw new Error('Method not implemented.');
    }
}