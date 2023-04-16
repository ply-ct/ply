import * as assert from 'assert';
import { loadYaml, Ply } from '../../src';
import { PlyResponse } from '../../src/response';

describe('Response', async () => {
    const options = new Ply().options;

    it('recognizes JSON object body content', async () => {
        const bodyObj = { foo: 'bar' };
        let plyResponse = new PlyResponse(
            '123',
            { code: 200, message: 'OK' },
            {},
            JSON.stringify(bodyObj)
        );
        let response = plyResponse.getResponse('123', options);
        assert.strictEqual(typeof response.body, 'object');
        assert.deepStrictEqual(response.body, bodyObj);

        plyResponse = new PlyResponse('456', { code: 200, message: 'OK' }, {}, bodyObj);
        response = plyResponse.getResponse('456', options, {}, true);
        assert.strictEqual(typeof response.body, 'string');
        assert.strictEqual(response.body, JSON.stringify(bodyObj, null, options.prettyIndent));
    });

    it('recognizes JSON array body content', async () => {
        const bodyArr = ['foo', 'bar'];
        let plyResponse = new PlyResponse(
            '789',
            { code: 200, message: 'OK' },
            {},
            JSON.stringify(bodyArr)
        );
        let response = plyResponse.getResponse('789', options);
        assert.strictEqual(Array.isArray(response.body), true);
        assert.deepStrictEqual(response.body, bodyArr);

        plyResponse = new PlyResponse('abc', { code: 200, message: 'OK' }, {}, bodyArr);
        response = plyResponse.getResponse('abc', options, {}, true);
        assert.strictEqual(typeof response.body, 'string');
        assert.strictEqual(response.body, JSON.stringify(bodyArr, null, options.prettyIndent));
    });

    it('can parse response from results', async () => {
        const ply = new Ply();
        const suite = await ply.loadRequestSuite('test/ply/requests/movie-queries.ply.yaml');
        const results = await suite.run({
            baseUrl: 'http://localhost:3000',
            year: '1931',
            rating: '5',
            query: 'year=1935&rating=>4&sort=rating&descending=true'
        });
        assert.strictEqual(results[0].status, 'Passed');

        const responses = suite.runtime.results.responsesFromActual();
        const response = responses['movieById'];
        assert.strictEqual(response?.status?.code, 200);
        assert.ok(response?.headers);
        assert.strictEqual(response.headers['content-type'], 'application/json; charset=utf-8');
        assert.ok(response?.submitted);
        assert.strictEqual(typeof response?.time, 'number');

        const source = loadYaml(
            'test/ply/results/requests/movie-queries.yaml#movieById',
            response.source
        );
        assert.strictEqual(source.movieById.response.body, response.body);
    });

    it('can parse looping responses', async () => {
        const ply = new Ply();
        const flow = await ply.loadFlow('test/ply/flows/loops.ply.flow');
        const results = await flow.run({ baseUrl: 'http://localhost:3000' }, { trusted: true });
        assert.strictEqual(results[0].status, 'Passed');

        const responses = flow.runtime.results.responsesFromActual();
        const secondResponse = responses['Get Movie_1'];
        assert.strictEqual(secondResponse.status.code, 200);
        assert.ok(secondResponse.headers);
        assert.strictEqual(
            secondResponse.headers['content-type'],
            'application/json; charset=utf-8'
        );
        assert.ok(secondResponse.submitted);
        assert.strictEqual(typeof secondResponse.time, 'number');

        const movie = JSON.parse(secondResponse.body).movies[0];
        assert.strictEqual(movie.title, 'Island of Lost Souls');
        console.log('SOURCE:\n' + secondResponse.source);
        const source = loadYaml(
            'test/ply/results/actual/flows/loops.yaml#Get Movie_1',
            secondResponse.source
        );
        const sourceMovie = JSON.parse(source['Get Movie_1'].response.body).movies[0];
        assert.strictEqual(sourceMovie.title, 'Island of Lost Souls');
    });
});
