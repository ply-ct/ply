import * as assert from 'assert';
import ply from '../../src/index';
import { SuiteNoArgs, SuiteWithArgs } from './suites';

describe('Decorators', async () => {

    it('handles @suite without args', async () => {

        let suite = new SuiteNoArgs();

        console.log("HEY");
    });

    it('handles @suite with args', async () => {

        let suite = new SuiteWithArgs();

        console.log("HEY 3");
    });

    it('loads suites from ts', async () => {
        const suites = await ply.loadCases('test/mocha/suites.ts');
        assert.equal(suites.length, 2);
        assert.equal(suites[0].name, 'SuiteNoArgs');
        assert.equal(suites[0].startLine, 4);
        assert.equal(suites[0].endLine, 11);
        assert.equal(suites[1].name, 'my suite name');
        assert.equal(suites[1].startLine, 13);
        assert.equal(suites[1].endLine, 20);
    });

});
