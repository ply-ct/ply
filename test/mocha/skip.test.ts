import * as assert from 'assert';
import { Ply } from '../../src/ply';
import { Config } from '../../src/options';

describe('Skip', () => {

    it('should identify skipped requests', async () => {
        const ply = new Ply();
        const suites = await ply.loadRequests(
            'test/ply/requests/movie-queries.ply.yaml',
            'test/ply/requests/movies-api.ply.yaml'
        );

        assert.ok(!suites[0].skip);
        assert.ok(suites[1].skip);
    });

    it('should identify skipped cases', async () => {

        const ply = new Ply({
            ...new Config().options,
            testsLocation: 'test/mocha',
            expectedLocation: 'test/mocha/results/expected',
            actualLocation: 'test/mocha/results/actual',
            skip: '**/skipped-*'
        });

        const suites = await ply.loadCases('test/mocha/suites.ts', 'test/mocha/skipped-suite.ts');
        assert.ok(!suites[0].skip);
        assert.ok(!suites[1].skip);
        assert.ok(suites[2].skip);
    });

});
