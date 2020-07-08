import { TEST, BEFORE, AFTER, SUITE } from './names';

type ClassTarget = {
    new(...args: any[]): any,
    name: string
};

export interface TestSuite {
    name: string;
    className: string;
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
            if ((target as any)[SUITE]) {
                throw new Error(`@suite ${target.name} must not extend another @suite-decorated class.`);
            }
            (target as any)[SUITE] = { name: nameOrTarget };
        };
    }
    else {
        // no decorator args: first function param is ClassTarget
        if ((nameOrTarget as any)[SUITE]) {
            throw new Error(`@suite ${nameOrTarget.name} must not extend another @suite-decorated class.`);
        }
        (nameOrTarget as any)[SUITE] = { name: nameOrTarget.name };
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
            target[propertyKey][TEST] = { name: nameOrTarget };
        };
    }
    else {
        // no decorator args: first function param is target, second is propKey, etc
        nameOrTarget[propertyKey!][TEST] = { name: propertyKey };
    }
}

export interface Before {
    name: string,
    tests?: string,
    method: Function,
    hasRun: boolean
}

/**
 * Invoked before tests.
 * @param tests glob pattern for test names before which function will be called (* = each, omitted = once before all)
 */
export function before(target: any, propertyKey: string, descriptor: PropertyDescriptor): void;
export function before(tests: string): (target: any, propertyKey: string, descriptor: PropertyDescriptor) => void;
export function before(testsOrTarget: string | any, propertyKey?: string, _descriptor?: PropertyDescriptor) {
    if (typeof testsOrTarget === 'string') {
        return function (target: any, propertyKey: string, _descriptor: PropertyDescriptor) {
            target[propertyKey][BEFORE] = { name: propertyKey, tests: testsOrTarget };
        };
    }
    else {
        testsOrTarget[propertyKey!][BEFORE] = { name: propertyKey };
    }
}

export interface After {
    name: string,
    tests?: string,
    method: Function,
    hasRun: boolean
}

/**
 * Invoked after tests.
 * @param tests glob pattern for test names after which function will be called (* = each, omitted = once after all)
 */
export function after(target: any, propertyKey: string, descriptor: PropertyDescriptor): void;
export function after(tests: string): (target: any, propertyKey: string, descriptor: PropertyDescriptor) => void;
export function after(testsOrTarget: string | any, propertyKey?: string, _descriptor?: PropertyDescriptor) {
    if (typeof testsOrTarget === 'string') {
        return function (target: any, propertyKey: string, _descriptor: PropertyDescriptor) {
            target[propertyKey][AFTER] = { name: propertyKey, tests: testsOrTarget };
        };
    }
    else {
        testsOrTarget[propertyKey!][AFTER] = { name: propertyKey };
    }
}

