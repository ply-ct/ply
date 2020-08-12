import * as assert from 'assert';
import { Options, Defaults, Config } from '../../../src/options';

describe('Results', () => {

    it('locations reflect testsLocation', () => {
        const options: Options = new Config(new Defaults(), false, 'test/mocha/results/plyconfig.yaml').options;
        assert.equal(options.testsLocation, 'test/mocha/results');
        assert.equal(options.expectedLocation, 'test/mocha/results/results/expected');
        assert.equal(options.actualLocation, 'test/mocha/results/results/actual');
        assert.equal(options.logLocation, 'test/mocha/results/results/actual');
    });
});
