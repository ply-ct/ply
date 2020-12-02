import * as assert from 'assert';
import { Ply } from '../../src/ply';
import { Config } from '../../src/options';
import { Storage } from '../../src/storage';

const values = {
    baseUrl: 'http://localhost:3000/movies',
    year: 1931,
    rating: 5,
    query: 'year=1935&rating=>4&sort=rating&descending=true'
};

describe('Flows', async () => {

    it('can run suite', async () => {
        const ply = new Ply();
        const suites = await ply.loadFlows('test/ply/flows/movie-queries.ply.flow');
        const suite = suites[0];
        const results = await suite.run(values);

        assert.strictEqual(results[0].status, 'Passed');
    });

    it('does create expected', async () => {
        const options = { ...new Config().options, expectedLocation: 'temp' };
        const ply = new Ply(options);
        const suites = await ply.loadFlows('test/ply/flows/movie-queries.ply.flow');
        const suite = suites[0];
        const results = await suite.run(values, { createExpected: true });

        // remove before assertions in case test fails
        new Storage('temp/flows/movie-queries.yml').remove();

        assert.strictEqual(results[0].status, 'Passed');
    });

    it('can parse instance', async () => {
        const ply = new Ply();
        const suites = await ply.loadFlows('test/ply/flows/movies-api.ply.flow');
        const suite = suites[0];
        const results = await suite.run(values);
        assert.strictEqual(results[0].status, 'Passed');

        const instance = suite.runtime.results.flowInstanceFromActual('test/ply/results/actual/flows/movies-api');
        console.log("INSTANCE: " + JSON.stringify(instance, null, 2));
    });
});