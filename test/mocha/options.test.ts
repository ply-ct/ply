import * as assert from 'assert';
import { Options, Config } from '../../src/options';

describe('Options', function () {

    it('is loaded from config', function () {
        const options: Options = new Config().options;
        assert.equal(options.testsLocation, 'test/ply');
        assert.deepEqual(options.requestFiles, ['**/*.ply.yaml'])
    });
});
