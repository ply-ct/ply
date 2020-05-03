import * as assert from 'assert';
import { PlyOptions, Config } from '../../src/options';
import { Ply } from '../../src/ply';
import { PlyRequest } from '../../src/request';

describe('Requests', async () => {

    it('is loaded from yaml', async () => {
        const options: PlyOptions = new Config().options;
        const ply = new Ply(options);
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
        const options: PlyOptions = new Config().options;
        const ply = new Ply(options);
        await assert.rejects(async () => {
            return ply.loadRequests(['test/ply/requests/bad-requests.ply.yaml']);
        },
        {
            name: 'Error',
            message: "Request is missing 'url'"
        });
    });

    it('can handle success', async () => {
        const options: PlyOptions = new Config().options;
        const ply = new Ply({...options, verbose: false});
        const suites = await ply.loadRequests('test/ply/requests/movie-queries.ply.yaml');
        let suite = suites[0];

        const values = {
            "baseUrl": "http://localhost:8080/ply-demo/api",
            "year": 1931,
            "rating": 5
        };

        const results = await suite.run('moviesByYearAndRating', values);
        assert.equal(results[0].status, 'Passed');
        assert.equal(results[0].message, 'Test succeeded');
    });

    it('can run suite', async () => {
        const options: PlyOptions = new Config().options;
        const ply = new Ply({ ...options, verbose: true });
        const suites = await ply.loadRequests('test/ply/requests/movie-queries.ply.yaml');
        let suite = suites[0];

        const values = {
            baseUrl: "http://localhost:8080/ply-demo/api",
            year: 1931,
            rating: 5,
            id: 'eec22a97',
            query: 'year=1935&rating=>4&sort=rating&descending=true'
        };

        const result = await suite.run(values);
        console.log("RESULT: " + JSON.stringify(result, null, 2));
    });
});
