import * as assert from 'assert';
import { Ply, Plyer } from '../../src/ply';
import { Config } from '../../src/options';
import { PlyRequest } from '../../src/request';

const values = {
    baseUrl: 'http://localhost:3000/movies',
    year: 1931,
    rating: 5,
    id: 'eec22a97',
    query: 'year=1935&rating=>4&sort=rating&descending=true'
};

describe('Requests', async () => {

    it('is loaded from yaml', async () => {
        const ply = new Ply();
        const suites = await ply.loadRequests(
            'test/ply/requests/movie-queries.ply.yaml',
            'test/ply/requests/movies-api.ply.yaml'
        );

        assert.equal(suites.length, 2);
        let request = suites[0].get('moviesByYearAndRating') as PlyRequest;
        assert.equal(request.start, 0);
        assert.equal(request.end, 5);

        request = suites[0].get('movieById') as PlyRequest;
        assert.equal(request.name, 'movieById');
        assert.equal(request.method, 'GET');
        let headers = request.headers;
        assert.equal(headers['Accept'], 'application/json');
        assert.equal(request.start, 8);
        assert.equal(request.end, 12);
    });

    it('rejects missing url', async () => {
        const ply = new Ply();
        await assert.rejects(async () => {
            return ply.loadRequests(['test/ply/requests/bad-requests.ply.yaml']);
        },
        {
            name: 'Error',
            message: "Request missingUrl is missing 'url'"
        });
    });

    it('can handle success', async () => {
        const ply = new Ply();
        const suites = await ply.loadRequests('test/ply/requests/movie-queries.ply.yaml');
        let suite = suites[0];

        const values = {
            baseUrl: "http://localhost:3000/movies",
            year: 1931,
            rating: 5
        };

        const result = await suite.run('moviesByYearAndRating', values);
        assert.equal(result.status, 'Passed');
        assert.equal(result.message, 'Test succeeded');
    });

    it('can handle failure', async () => {
        const ply = new Ply();
        const suites = await ply.loadRequests('test/ply/requests/movie-queries.ply.yaml');
        let suite = suites[0];

        const values = {
            baseUrl: "http://localhost:3000/movies",
            id: 'xxxxxx'
        };

        const result = await suite.run('movieById', values);
        assert.equal(result.status, 'Failed');
        // TODO pad actual
        assert.equal(result.message, 'Results differ from line 9');
    });

    it('can handle error', async () => {
        const ply = new Ply({
            ...new Config().options,
            expectedLocation: 'test/ply/results/expected-not-exist'
        });
        const suite = (await ply.loadRequests('test/ply/requests/movie-queries.ply.yaml'))[0];
        const result = await suite.run('movieById', values);
        assert.equal(result.status, 'Errored');
    });

    it('can iterate suite', async () => {
        const ply = new Ply();
        const suites = await ply.loadRequests('test/ply/requests/movie-queries.ply.yaml');
        let suite = suites[0];
        let requests = [];
        for (const request of suite) {
            requests.push(request);
        }
        assert.equal(requests[0].name, 'moviesByYearAndRating');
        assert.equal(requests[1].name, 'movieById');
        assert.equal(requests[2].name, 'moviesQuery');
    });

    it('can run plyees', async () => {
        const plyer = new Plyer();
        let results = await plyer.run(['test/ply/requests/movie-queries.ply.yaml#moviesByYearAndRating'], values);
        assert.equal(results[0].status, 'Passed');
        assert.equal(results[0].message, 'Test succeeded');
    });

    it('can run suite', async () => {
        const ply = new Ply();
        const suites = await ply.loadRequests('test/ply/requests/movie-queries.ply.yaml');
        let suite = suites[0];
        await suite.run(values);
    });
});
