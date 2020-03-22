import { Injector } from './injection';

export function suite(name: string) {
    return (constructor: any) => {
        const symbol = Injector.SUITE_PREFIX + name;
        if (constructor[symbol]) {
            throw new Error(`@suite ${constructor.name} can not extend another @suite class.`);
        }
        // TODO symbol object will hold other decorator values
        constructor[symbol] = { name };

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


    };
}

export function test(name: string) {
    return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
        // console.log("\nTEST NAME: " + name);
        // console.log("PROP KEY: " + propertyKey);
        // console.log("DESCRIPTOR: " + JSON.stringify(descriptor, null, 2));
        // console.log("TARGET: " + JSON.stringify(target, null, 2));
        // target[propertyKey]();
    };
}