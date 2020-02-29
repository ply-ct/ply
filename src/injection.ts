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
    constructor(private readonly cls: Cls<any>) {
    }

    create(): any {
        return new this.cls();
    }

    run(method: any): void {

    }
}