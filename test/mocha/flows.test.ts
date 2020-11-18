import * as assert from 'assert';
import { Ply, Plier } from '../../src/ply';

const values = {
    baseUrl: 'http://localhost:3000/movies',
    year: 1931,
    rating: 5,
    query: 'year=1935&rating=>4&sort=rating&descending=true'
};

describe('Flows', async () => {

    it('can run suite', async () => {
        const ply = new Ply();
        const suites = await ply.loadFlows('test/ply/flows/start-request-stop.ply.flow');
        const suite = suites[0];
        const results = await suite.run(values);

        assert.strictEqual(results[0].status, 'Passed');
    });
});