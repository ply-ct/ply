import * as assert from 'assert';
import { PlyOptions, Config } from '../../src/options';
import { Ply } from '../../src/ply';

describe('Requests', async () => {

    it('is loaded from yaml', async () => {
        const options: PlyOptions = new Config().options;
        const ply = new Ply(options);
        const suites = await ply.loadRequests([
            'test/ply/requests/movie-queries.ply.yaml',
            'test/ply/requests/movies-api.ply.yaml'
        ]);

        assert.equal(suites.length, 2);
        assert.equal(suites[0].actual.location.path,
            'test/ply/results/actual/requests/movie-queries.ply.yaml');

        let request = suites[0].get('moviesByYearAndRating')!;
        assert.ok(request !== null);
        assert.equal(request.suitePath, 'requests/movie-queries.ply.yaml');
        assert.equal(request.name, 'moviesByYearAndRating');
        assert.equal(request.method, 'GET');
        let headers = request.headers;
        assert.equal(headers['Accept'], 'application/json');
        assert.equal(request.startLine, 6);
        assert.equal(request.endLine, 10);
    });

    it('rejects missing url', async () => {
        const options: PlyOptions = new Config().options;
        const ply = new Ply(options);
        assert.rejects(async () => {
            await ply.loadRequests([
                'test/ply/requests/bad-request.ply.yaml'
            ]);
        }, Error, "'requests/bad-request.ply.yaml#missingUrl' -> Bad request url: undefined");
    });

    it('can run get', async () => {
        const options: PlyOptions = new Config().options;
        const ply = new Ply(options);
        const suites = await ply.loadRequests(['test/ply/requests/movie-queries.ply.yaml']);
        let request = suites[0].get('moviesByYearAndRating')!;

        const values = {
            "baseUrl": "https://ply-ct.com/demo/api",
            "year": 1931,
            "rating": 5
        };

        const response = await request.run(options, values);
        assert.equal(response.status.code, 200);
        assert.equal(response.headers['content-type'], 'application/json');
        const movies = JSON.parse(response.body).movies;
        assert.equal(movies[0].title, 'Dracula');
    });
});
