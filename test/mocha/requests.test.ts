import * as assert from 'assert';
import { Ply, Plier } from '../../src/ply';
import { Config } from '../../src/options';
import { PlyRequest } from '../../src/request';
import { Storage } from '../../src/storage';
import { NoExpectedResultDispensation } from '../../src/runtime';

const values = {
    baseUrl: 'http://localhost:3000/movies',
    year: 1931,
    rating: 5,
    query: 'year=1935&rating=>4&sort=rating&descending=true'
};

describe('Requests', async () => {

    beforeEach(() => {
        const missingExpected = new Storage('test/mocha/results/expected/requests/movie-queries.yaml');
        if (missingExpected.exists) {
            missingExpected.remove();
        }
    });

    it('is loaded from yaml', async () => {
        const ply = new Ply();
        const suites = await ply.loadRequests(
            'test/ply/requests/movie-queries.ply.yaml',
            'test/ply/requests/movies-api.ply.yaml'
        );

        assert.equal(suites.length, 2);
        let request = suites[0].get('moviesByYearAndRating') as PlyRequest;
        assert.equal(request.start, 0);
        assert.equal(request.end, 4);

        request = suites[0].get('movieById') as PlyRequest;
        assert.equal(request.name, 'movieById');
        assert.equal(request.method, 'GET');
        const headers = request.headers;
        assert.equal(headers['Accept'], 'application/json');
        assert.equal(request.start, 6);
        assert.equal(request.end, 11);
    });

    it('rejects missing url', async () => {
        const ply = new Ply();
        await assert.rejects(async () => {
            return ply.loadRequests(['test/ply/requests/bad-requests.ply.yaml']);
        },
        {
            name: 'Error',
            message: "Request missingUrl in test/ply/requests/bad-requests.ply.yaml is missing 'url'"
        });
    });

    it('can handle success', async () => {
        const ply = new Ply();
        const suites = await ply.loadRequests('test/ply/requests/movie-queries.ply.yaml');
        const suite = suites[0];

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
        const suite = suites[0];

        const values = {
            baseUrl: "http://localhost:3000/movies",
            year: 1932,  // instead of 1931
            rating: 5
        };

        const result = await suite.run('moviesByYearAndRating', values);
        assert.equal(result.status, 'Failed');
        assert.equal(result.message, 'Results differ from line 19');
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
        const suite = suites[0];
        const requests = [];
        for (const request of suite) {
            requests.push(request);
        }
        assert.equal(requests[0].name, 'moviesByYearAndRating');
        assert.equal(requests[1].name, 'movieById');
        assert.equal(requests[2].name, 'moviesQuery');
    });

    it('can run plyee', async () => {
        const plier = new Plier();
        const results = await plier.run(['test/ply/requests/movie-queries.ply.yaml#moviesByYearAndRating'], values);
        assert.equal(results[0].status, 'Passed');
        assert.equal(results[0].message, 'Test succeeded');
    });

    it('can run plyees', async () => {
        const plier = new Plier();
        const results = await plier.run([
            '/Users/donald/ply/ply/test/ply/requests/movie-queries.ply.yaml#moviesByYearAndRating',
            '/Users/donald/ply/ply/test/ply/requests/movie-queries.ply.yaml#movieById',
            '/Users/donald/ply/ply/test/ply/requests/movie-queries.ply.yaml#moviesQuery'
          ], values);
        assert.equal(results[0].status, 'Passed');
        assert.equal(results[0].message, 'Test succeeded');
        assert.equal(results[1].status, 'Passed');
        assert.equal(results[1].message, 'Test succeeded');
        assert.equal(results[2].status, 'Passed');
        assert.equal(results[2].message, 'Test succeeded');
    });

    it('can run suite', async () => {
        const ply = new Ply();
        const suites = await ply.loadRequests('test/ply/requests/movie-queries.ply.yaml');
        const suite = suites[0];
        const results = await suite.run(values);

        assert.equal(results[0].status, 'Passed');
        assert.equal(results[1].status, 'Passed');
        assert.equal(results[2].status, 'Passed');
    });

    it('honors NoVerify', async () => {
        const ply = new Ply({
            ...new Config().options,
            // expected results don't live here -- triggering NoExpectedResultDispensation
            expectedLocation: 'test/mocha/results/expected',
            actualLocation: 'test/mocha/results/actual'
        });

        const suites = await ply.loadRequests('test/ply/requests/movie-queries.ply.yaml');
        const suite = suites[0];
        const runOptions = { noExpectedResult: NoExpectedResultDispensation.NoVerify };
        const results = await suite.run(values, runOptions);

        assert.equal(results[0].status, 'Not Verified');
        assert.equal(results[1].status, 'Not Verified');
        assert.equal(results[2].status, 'Not Verified');
    });

    it('honors CreateExpected', async () => {
        const ply = new Ply({
            ...new Config().options,
            // expected results don't live here -- triggering NoExpectedResultDispensation
            expectedLocation: 'test/mocha/results/expected',
            actualLocation: 'test/mocha/results/actual'
        });

        const suites = await ply.loadRequests('test/ply/requests/movie-queries.ply.yaml');
        const suite = suites[0];
        const runOptions = { noExpectedResult: NoExpectedResultDispensation.CreateExpected };
        const results = await suite.run(values, runOptions);

        assert.equal(results[0].status, 'Passed');
        assert.equal(results[1].status, 'Passed');
        assert.equal(results[2].status, 'Passed');

        const expected = new Storage('test/mocha/results/expected/requests/movie-queries.yaml');
        assert.ok(expected.exists);
    });
});
