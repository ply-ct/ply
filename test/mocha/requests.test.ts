import * as assert from 'assert';
import { Options, Config } from '../../src/options';
import { Ply } from '../../src/ply';

describe('Requests', async () => {

    it('is loaded from yaml', async () => {
        const options: Options = new Config().options;
        const ply = new Ply(options);
        const suites = await ply.loadRequests([
            'test/ply/requests/movie-queries.ply.yaml',
            'test/ply/requests/movies-api.ply.yaml'
        ]);

        assert.equal(suites.length, 2);
        assert.equal(suites[0].actual.location.path,
            'test/ply/results/actual/requests/movie-queries.ply.yaml');

        let request = suites[0].children.get('moviesByYearAndRating')!;
        assert.ok(request !== null);
        assert.equal(request.suite, 'requests/movie-queries.ply.yaml');
        assert.equal(request.name, 'moviesByYearAndRating');
        assert.equal(request.method, 'GET');
        let headers = request.headers;
        assert.equal(headers['Accept'], 'application/json');
        assert.equal(request.line, 6);

    });

    it('rejects missing url', async () => {
        const options: Options = new Config().options;
        const ply = new Ply(options);
        assert.rejects(async () => {
            await ply.loadRequests([
                'test/ply/requests/bad-request.ply.yaml'
            ]);
        }, Error, "'requests/bad-request.ply.yaml#missingUrl' -> Bad request url: undefined");
    });
});
