import * as assert from 'assert';
import * as yaml from '../../src/yaml';
import { Retrieval } from '../../src/retrieval';

describe('Yaml', () => {

    it('reads line numbers', async () => {

        const retrieval = new Retrieval('test/ply/requests/movie-queries.ply.yaml');
        const yml = await retrieval.read();
        const obj = yaml.load(retrieval.toString(), yml!, true);

        assert.equal(obj['moviesByYearAndRating'].__start, 0);
        assert.equal(obj['moviesByYearAndRating'].__end, 5);
        assert.equal(obj['movieById'].__start, 8);
        assert.equal(obj['movieById'].__end, 12);
        assert.equal(obj['moviesQuery'].__start, 15);
        assert.equal(obj['moviesQuery'].__end, 19);
    });
});
