import { Injector } from './injection'

export function suite(name: string) {
    return (constructor: Function) => {
        console.log("SUITE CTOR: " + name);
        let cls: any = constructor;
        const injector = new Injector(cls);
        const inst = injector.create();
        console.log("INST['member']: " + inst['member']);

        const before = inst['before'];
        if (before) {
            before.call(inst);
        }

        const meth = "createMovie"
        inst[meth]();


        // let cls: any = constructor;
        // let inst = new cls();



    }
}

export function test(name: string) {
    return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
        console.log("TEST METHOD: " + name);
        console.log("TARGET x: " + target);
        // target[propertyKey]();
    };
}