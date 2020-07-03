import * as assert from 'assert';
import { Ply } from '../../src/ply';
import { Config } from '../../src/options';

describe('Ignore', () => {

    it('should identify ignored requests', async () => {
        const ply = new Ply();
        const suites = await ply.loadRequests(
            'test/ply/requests/movie-queries.ply.yaml',
            'test/ply/requests/movies-api.ply.yaml'
        );

        assert.ok(!suites[0].ignored);
        assert.ok(suites[1].ignored);
    });

    it('should identify ignored cases', async () => {

        const ply = new Ply({
            ...new Config().options,
            testsLocation: 'test/mocha',
            expectedLocation: 'test/mocha/results/expected',
            actualLocation: 'test/mocha/results/actual'
        });

        const suites = await ply.loadCases('test/mocha/suites.ts', 'test/mocha/ignored-suite.ts');
        assert.ok(!suites[0].ignored);
        assert.ok(!suites[1].ignored);
        assert.ok(suites[2].ignored);
    });

});
