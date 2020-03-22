export type Done = (err?: any) => void;

export interface Inst {
    /**
     * An instance method, that if defined, is executed before every test method.
     */
    before?(done?: Done): void | Promise<void>;

    /**
     * An instance method, that if defined, is executed after every test method.
     */
    after?(done?: Done): void | Promise<void>;
}

export interface Cls<T extends Inst> {
    new(...args: any[]): T;
    prototype: T;

    /**
     * A static method, that if defined, is executed once, before all test methods.
     */
    before?(done?: Done): void | Promise<void>;

    /**
     * A static method, that if defined, is executed once, after all test methods.
     */
    after?(done?: Done): void | Promise<void>;
}

export class Injector {

    static SUITE_PREFIX = '__ply_suite_';

    constructor(private readonly cls: Cls<any>) {
    }

    create(): any {
        return new this.cls();
    }

    run(method: any): void {

    }

//     applySuiteDecorator(name: string, ctor) {
//     if (ctor[ClassTestUI.suiteSymbol]) {
//         throw new Error(`@suite ${ctor.name} can not subclass another @suite class, use abstract base class instead.`);
//     }
//     ctor[ClassTestUI.suiteSymbol] = true;
//     if (execution) {
//         ctor[ClassTestUI.executionSymbol] = execution;
//     }
//     theTestUI.runner.suite(name, theTestUI.suiteCallbackFromClass(ctor), theTestUI.getSettings(ctor));
// }
}