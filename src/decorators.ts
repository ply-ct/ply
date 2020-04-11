const PLY_PREFIX = '__ply';
export const SUITE_PREFIX = `${PLY_PREFIX}_suite`;
export const TEST_PREFIX = `${PLY_PREFIX}_test`;
export const BEFORE_PREFIX = `${PLY_PREFIX}_before`;
export const AFTER_PREFIX = `${PLY_PREFIX}_after`;

type ClassTarget = {
    new(...args: any[]): any,
    name: string
};

export interface TestSuite extends ClassTarget{

}

/**
 * If name arg is not specified, class name is suite name.
 */
export function suite(target: ClassTarget): void;
export function suite(name: string): (target: ClassTarget) => void;
export function suite(nameOrTarget: string | ClassTarget) {

    if (typeof nameOrTarget === 'string') {
        // with decorator args: function params are dec args, return callback taking Target
        return function (target: ClassTarget) {
            // class name is target.name
            if ((target as any)[SUITE_PREFIX]) {
                throw new Error(`@suite ${target.name} must not extend another @suite-decorated class.`);
            }
            (target as any)[SUITE_PREFIX] = { name: nameOrTarget };
        };
    }
    else {
        // no decorator args: first function param is ClassTarget
        if ((nameOrTarget as any)[SUITE_PREFIX]) {
            throw new Error(`@suite ${nameOrTarget.name} must not extend another @suite-decorated class.`);
        }
        (nameOrTarget as any)[SUITE_PREFIX] = { name: nameOrTarget.name };
    }
}

export interface TestCase {
    name: string,
    method: Function
}

/**
 * If name arg is not specified, function name is test name.
 */
export function test(target: any, propertyKey: string, descriptor: PropertyDescriptor): void;
export function test(name: string): (target: any, propertyKey: string, descriptor: PropertyDescriptor) => void;
export function test(nameOrTarget: string | any, propertyKey?: string, _descriptor?: PropertyDescriptor) {
    if (typeof nameOrTarget === 'string') {
        return function (target: any, propertyKey: string, _descriptor: PropertyDescriptor) {
            // with decorator args: function params are dec args, return callback taking Target, etc
            target[propertyKey][TEST_PREFIX] = { name: nameOrTarget };
        };
    }
    else {
        // no decorator args: first function param is target, second is propKey, etc
        nameOrTarget[propertyKey!][TEST_PREFIX] = { name: propertyKey };
    }
}

export interface Before {
    name: string,
    tests?: string,
    method: Function
}

/**
 * Invoked before tests.
 * @param tests pattern for test names before which function will be called (* = each, omitted = once before all)
 */
export function before(target: any, propertyKey: string, descriptor: PropertyDescriptor): void;
export function before(tests: string): (target: any, propertyKey: string, descriptor: PropertyDescriptor) => void;
export function before(testsOrTarget: string | any, propertyKey?: string, _descriptor?: PropertyDescriptor) {
    if (typeof testsOrTarget === 'string') {
        return function (target: any, propertyKey: string, _descriptor: PropertyDescriptor) {
            target[propertyKey][BEFORE_PREFIX] = { name: propertyKey, tests: testsOrTarget };
        };
    }
    else {
        testsOrTarget[propertyKey!][BEFORE_PREFIX] = { name: propertyKey };
    }
}

export interface After {
    name: string,
    tests?: string,
    method: Function
}

/**
 * Invoked after tests.
 * @param tests pattern for test names after which function will be called (* = each, omitted = once after all)
 */
export function after(target: any, propertyKey: string, descriptor: PropertyDescriptor): void;
export function after(tests: string): (target: any, propertyKey: string, descriptor: PropertyDescriptor) => void;
export function after(testsOrTarget: string | any, propertyKey?: string, _descriptor?: PropertyDescriptor) {
    if (typeof testsOrTarget === 'string') {
        return function (target: any, propertyKey: string, _descriptor: PropertyDescriptor) {
            target[propertyKey][AFTER_PREFIX] = { name: propertyKey, tests: testsOrTarget };
        };
    }
    else {
        testsOrTarget[propertyKey!][AFTER_PREFIX] = { name: propertyKey };
    }
}

