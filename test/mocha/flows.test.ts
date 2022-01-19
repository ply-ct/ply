import * as assert from 'assert';
import { Ply } from '../../src/ply';
import { Config } from '../../src/options';
import { Storage } from '../../src/storage';
import * as util from '../../src/util';

const values = {
    baseUrl: 'http://localhost:3000',
    year: 1931,
    rating: 5,
    queries: {
        highlyRated1935: "year=1935&rating=>4&sort=rating&descending=true",
        tipTop1935: "year=1935&sort=rating&descending=true&max=1",
        poorlyRated1932: "year=1932&rating=<=2"
  }
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
        assert.ok(instance);

        const checkDate = (date?: Date) => {
            assert.ok(date);
            assert.ok(util.timestamp(date));
            const today = new Date();
            assert.strictEqual(date.getFullYear(), today.getFullYear());
            assert.strictEqual(date.getMonth(), today.getMonth());
            // TODO off by 1 day in GitHub workflows between 6p - 7p MDT
            // Due to Node/V8 bug: https://github.com/nodejs/node/issues/33089
            // assert.strictEqual(date.getDate(), today.getDate());
        };

        assert.ok(instance.subflowInstances);
        const beforeAllSubflow = instance.subflowInstances[0];
        assert.strictEqual(beforeAllSubflow.status, 'Completed');
        checkDate(beforeAllSubflow.start);
        checkDate(beforeAllSubflow.end);

        assert.ok(beforeAllSubflow.stepInstances);
        assert.strictEqual(beforeAllSubflow.stepInstances.length, 3);
        const deleteMovie = beforeAllSubflow.stepInstances[1];
        assert.strictEqual(deleteMovie.stepId, 's5');
        assert.strictEqual(deleteMovie.status, 'Completed');
        checkDate(deleteMovie.start);
        checkDate(deleteMovie.end);

        // TODO request/response
        assert.ok(instance.stepInstances);
        assert.strictEqual(instance.stepInstances.length, 7);
        const createMovie = instance.stepInstances[1];
        assert.strictEqual(createMovie.stepId, 's7');
        assert.strictEqual(createMovie.status, 'Completed');
        checkDate(createMovie.start);
        checkDate(createMovie.end);
    });
});