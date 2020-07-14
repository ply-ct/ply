import * as assert from 'assert';
import ply from '../../src/index';
import { UnnamedSuite, NamedSuite } from './suites';
import { DecoratedSuite } from '../../src/runtime';

describe('Decorators', async () => {

    it('reads unnamed @suite', async () => {

        const unnamed = new UnnamedSuite();
        const decorated = new DecoratedSuite(unnamed);
        assert.equal(decorated.testSuite.name, 'UnnamedSuite');
        assert.equal(decorated.befores.length, 1);
        assert.equal(decorated.befores[0].name, 'beforeAll');
        assert.ok(!decorated.befores[0].tests);

        const testCases = decorated.testCases;
        assert.equal(testCases.length, 2);
        assert.equal(testCases[0].name, 'unnamedCaseNoValues');
        assert.equal(testCases[1].name, 'unnamedCaseWithValues');

        assert.equal(decorated.afters.length, 1);
        assert.equal(decorated.afters[0].name, 'afterAll');
        assert.ok(!decorated.afters[0].tests);
    });

    it('reads named @suite', async () => {

        const named = new NamedSuite();
        const decorated = new DecoratedSuite(named);
        assert.equal(decorated.testSuite.name, 'my suite name');
        assert.equal(decorated.befores.length, 2);
        assert.equal(decorated.befores[0].name, 'beforeAll');
        assert.ok(!decorated.befores[0].tests);
        assert.equal(decorated.befores[1].name, 'beforeEach');
        assert.equal(decorated.befores[1].tests, '*');

        const testCases = decorated.testCases;
        assert.equal(testCases.length, 2);
        assert.equal(testCases[0].name, 'first case');
        assert.equal(testCases[0].method.name, 'namedCaseNoValues');
        assert.equal(testCases[1].name, 'second case');
        assert.equal(testCases[1].method.name, 'namedCaseWithValues');

        assert.equal(decorated.afters.length, 2);
        assert.equal(decorated.afters[0].name, 'afterEach');
        assert.equal(decorated.afters[0].tests, '*');
        assert.equal(decorated.afters[1].name, 'afterAll');
        assert.ok(!decorated.afters[1].tests);
    });

    it('loads suites from ts', async () => {
        const suites = await ply.loadCases('test/mocha/suites.ts');
        assert.equal(suites.length, 2);

        assert.equal(suites[0].name, 'UnnamedSuite');
        assert.equal(suites[0].className, 'UnnamedSuite');
        assert.equal(suites[0].start, 6);
        assert.equal(suites[0].end, 35);
        const unnamedTests = suites[0].tests;
        assert.equal(Object.keys(unnamedTests).length, 2);
        const unnamedCaseNoValues = suites[0].tests['unnamedCaseNoValues'];
        assert.equal(unnamedCaseNoValues.name, 'unnamedCaseNoValues');
        assert.equal(unnamedCaseNoValues.method, 'unnamedCaseNoValues');
        assert.equal(unnamedCaseNoValues.start, 19);
        assert.equal(unnamedCaseNoValues.end, 22);
        const unnamedCaseWithValues = suites[0].tests['unnamedCaseWithValues'];
        assert.equal(unnamedCaseWithValues.name, 'unnamedCaseWithValues');
        assert.equal(unnamedCaseWithValues.method, 'unnamedCaseWithValues');

        assert.equal(suites[1].name, 'my suite name');
        assert.equal(suites[1].className, 'NamedSuite');
        assert.equal(suites[1].start, 37);
        assert.equal(suites[1].end, 76);
        const namedCaseNoValues = suites[1].tests['first case'];
        assert.equal(namedCaseNoValues.name, 'first case');
        assert.equal(namedCaseNoValues.method, 'namedCaseNoValues');
        assert.equal(namedCaseNoValues.start, 55);
        assert.equal(namedCaseNoValues.end, 58);
        const namedCaseWithValues = suites[1].tests['second case'];
        assert.equal(namedCaseWithValues.name, 'second case');
        assert.equal(namedCaseWithValues.method, 'namedCaseWithValues');
    });

});
