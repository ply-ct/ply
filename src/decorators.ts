import { Injector } from './injection';

type ClassTarget = {
    new(constructor: any): any,
    name: string,
};

/**
 * If name arg is not specified, class name is suite name.
 */
export function suite(target: ClassTarget): void;
export function suite(name: string): (target: ClassTarget) => void;
export function suite(nameOrTarget: string | ClassTarget) {
    if (typeof nameOrTarget !== 'string') {
        let constructor = (nameOrTarget as any).constructor;
        const symbol = Injector.SUITE_PREFIX + nameOrTarget.name;
        if (constructor[symbol]) {
            throw new Error(`@suite ${constructor.name} can not extend another @suite class.`);
        }
        // TODO symbol object will hold other decorator values
        constructor[symbol] = { name: nameOrTarget.name };
        console.log(nameOrTarget.name, ' is now decorated');
    }
    else {
        return function(target: ClassTarget) {
            const name = nameOrTarget || target.name;
            console.log(name, ' is now decorated');
        };
    }
}

//export function suite(name: string) {
//    return (constructor: any) => {
//        const symbol = Injector.SUITE_PREFIX + name;
        // if (constructor[symbol]) {
        //     throw new Error(`@suite ${constructor.name} can not extend another @suite class.`);
        // }
        // // TODO symbol object will hold other decorator values
        // constructor[symbol] = { name };

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


//     };
// }

export function test(name: string) {
    return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
        // console.log("\nTEST NAME: " + name);
        // console.log("PROP KEY: " + propertyKey);
        // console.log("DESCRIPTOR: " + JSON.stringify(descriptor, null, 2));
        // console.log("TARGET: " + JSON.stringify(target, null, 2));
        // target[propertyKey]();
    };
}


/**
 *
 * @param tests pattern for tests before which function will be called (* = each, omitted = once before all)
 */
// export function before(target: any, propertyKey: string, descriptor: PropertyDescriptor): void;
// export function before(tests: string): (target: any, propertyKey: string, descriptor: PropertyDescriptor) => void;
// export function before(targetOrTests: any, propertyKey: string | undefined, descriptor: PropertyDescriptor | undefined) {
//     return function(target: any, propertyKey: string, descriptor: PropertyDescriptor) {
//     };
// }

