import * as assert from 'assert';
import { Options, Config } from '../../src/options';

describe('Options', () => {
    it('is loaded from config', () => {
        const options: Options = new Config().options;
        assert.strictEqual(options.testsLocation, 'test/ply');
        assert.strictEqual(options.requestFiles, '**/*.{ply,ply.yaml}');
    });
});
