import * as assert from 'assert';
import { Options, Defaults, Config } from '../../../src/options';

describe('Results', () => {
    it('locations reflect testsLocation', () => {
        const options: Options = new Config(
            new Defaults(),
            false,
            'test/mocha/results/plyconfig.yaml'
        ).options;
        assert.strictEqual(options.testsLocation, 'test/mocha/results');
        assert.strictEqual(options.expectedLocation, 'test/mocha/results/results/expected');
        assert.strictEqual(options.actualLocation, 'test/mocha/results/results/actual');
        assert.strictEqual(options.logLocation, 'test/mocha/results/results/actual');
    });
});
