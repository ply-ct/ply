import * as assert from 'assert';
import { Options, Config } from '../../src/options';

describe('Options', () => {

    it('is loaded from config', () => {
        const options: Options = new Config().options;
        assert.equal(options.testsLocation, 'test/ply');
        assert.equal(options.requestFiles, '**/*.ply.yaml');
    });
});
