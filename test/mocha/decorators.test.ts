import * as assert from 'assert';
import ply from '../../src/index';
import { UnnamedSuite, NamedSuite } from './suites';
import { DecoratedSuite } from '../../src/runtime';

describe('Decorators', async () => {
    it('reads unnamed @suite', async () => {
        const unnamed = new UnnamedSuite();
        const decorated = new DecoratedSuite(unnamed);
        assert.strictEqual(decorated.testSuite.name, 'UnnamedSuite');
        assert.strictEqual(decorated.befores.length, 1);
        assert.strictEqual(decorated.befores[0].name, 'beforeAll');
        assert.ok(!decorated.befores[0].tests);

        const testCases = decorated.testCases;
        assert.strictEqual(testCases.length, 2);
        assert.strictEqual(testCases[0].name, 'unnamedCaseNoValues');
        assert.strictEqual(testCases[1].name, 'unnamedCaseWithValues');

        assert.strictEqual(decorated.afters.length, 1);
        assert.strictEqual(decorated.afters[0].name, 'afterAll');
        assert.ok(!decorated.afters[0].tests);
    });

    it('reads named @suite', async () => {
        const named = new NamedSuite();
        const decorated = new DecoratedSuite(named);
        assert.strictEqual(decorated.testSuite.name, 'my suite name');
        assert.strictEqual(decorated.befores.length, 2);
        assert.strictEqual(decorated.befores[0].name, 'beforeAll');
        assert.ok(!decorated.befores[0].tests);
        assert.strictEqual(decorated.befores[1].name, 'beforeEach');
        assert.strictEqual(decorated.befores[1].tests, '*');

        const testCases = decorated.testCases;
        assert.strictEqual(testCases.length, 2);
        assert.strictEqual(testCases[0].name, 'first case');
        assert.strictEqual(testCases[0].method.name, 'namedCaseNoValues');
        assert.strictEqual(testCases[1].name, 'second case');
        assert.strictEqual(testCases[1].method.name, 'namedCaseWithValues');

        assert.strictEqual(decorated.afters.length, 2);
        assert.strictEqual(decorated.afters[0].name, 'afterEach');
        assert.strictEqual(decorated.afters[0].tests, '*');
        assert.strictEqual(decorated.afters[1].name, 'afterAll');
        assert.ok(!decorated.afters[1].tests);
    });

    it('loads suites from ts', async () => {
        const suites = await ply.loadCases('test/mocha/suites.ts');
        assert.strictEqual(suites.length, 2);

        assert.strictEqual(suites[0].name, 'UnnamedSuite');
        assert.strictEqual(suites[0].className, 'UnnamedSuite');
        assert.strictEqual(suites[0].start, 6);
        assert.strictEqual(suites[0].end, 34);
        const unnamedTests = suites[0].tests;
        assert.strictEqual(Object.keys(unnamedTests).length, 2);
        const unnamedCaseNoValues = suites[0].tests['unnamedCaseNoValues'];
        assert.strictEqual(unnamedCaseNoValues.name, 'unnamedCaseNoValues');
        assert.strictEqual(unnamedCaseNoValues.method, 'unnamedCaseNoValues');
        assert.strictEqual(unnamedCaseNoValues.start, 18);
        assert.strictEqual(unnamedCaseNoValues.end, 21);
        const unnamedCaseWithValues = suites[0].tests['unnamedCaseWithValues'];
        assert.strictEqual(unnamedCaseWithValues.name, 'unnamedCaseWithValues');
        assert.strictEqual(unnamedCaseWithValues.method, 'unnamedCaseWithValues');

        assert.strictEqual(suites[1].name, 'my suite name');
        assert.strictEqual(suites[1].className, 'NamedSuite');
        assert.strictEqual(suites[1].start, 36);
        assert.strictEqual(suites[1].end, 74);
        const namedCaseNoValues = suites[1].tests['first case'];
        assert.strictEqual(namedCaseNoValues.name, 'first case');
        assert.strictEqual(namedCaseNoValues.method, 'namedCaseNoValues');
        assert.strictEqual(namedCaseNoValues.start, 53);
        assert.strictEqual(namedCaseNoValues.end, 56);
        const namedCaseWithValues = suites[1].tests['second case'];
        assert.strictEqual(namedCaseWithValues.name, 'second case');
        assert.strictEqual(namedCaseWithValues.method, 'namedCaseWithValues');
    });
});
