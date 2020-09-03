import * as fs from 'fs';
import * as assert from 'assert';
import * as yaml from '../../src/yaml';
import { Retrieval } from '../../src/retrieval';

describe('yaml', () => {

    it('assigns line numbers', async () => {

        const retrieval = new Retrieval('test/ply/requests/movie-queries.ply.yaml');
        const yml = await retrieval.read();
        const obj = yaml.load(retrieval.toString(), yml!, true);

        assert.equal(obj['moviesByYearAndRating'].__start, 0);
        assert.equal(obj['moviesByYearAndRating'].__end, 4);
        assert.equal(obj['movieById'].__start, 6);
        assert.equal(obj['movieById'].__end, 11);
        assert.equal(obj['moviesQuery'].__start, 14);
        assert.equal(obj['moviesQuery'].__end, 18);
    });

    it('assigns line nums of empty keys', () => {
        const file = 'test/mocha/results/expected/UnnamedSuite.yaml';
        const yml = fs.readFileSync(file, 'utf-8');
        const obj = yaml.load(file, yml, true);

        assert.equal(obj['unnamedCaseNoValues'].__start, 0);
        assert.equal(obj['unnamedCaseNoValues'].__end, 0);
        assert.equal(obj['unnamedCaseWithValues'].__start, 1);
        assert.equal(obj['unnamedCaseWithValues'].__end, 1);
    });

    it('assigns line nums of single obj', () => {
        const file = 'test/mocha/results/expected/single.yaml';
        const yml = fs.readFileSync(file, 'utf-8');
        const obj = yaml.load(file, yml, true);

        assert.equal(obj['aSingle'].__start, 0);
        assert.equal(obj['aSingle'].__end, 9);
    });

    it('assigns line nums of mixed objs', () => {
        const file = 'test/mocha/results/expected/foobar.yaml';
        const yml = fs.readFileSync(file, 'utf-8');
        const obj = yaml.load(file, yml, true);

        assert.equal(obj['foo'].__start, 2);
        assert.equal(obj['foo'].__end, 11);
        assert.equal(obj['bar'].__start, 14);
        assert.equal(obj['bar'].__end, 14);
        assert.equal(obj['baz'].__start, 17);
        assert.equal(obj['baz'].__end, 18);
    });

    it('handles escaped string content', async () => {
        const missive = 'Dear Sir,\n\nGo jump in the "lake".\n\n - A Friend';

        const file = 'test/mocha/requests/raw-requests.ply.yaml';
        const yml = fs.readFileSync(file, 'utf-8');
        const obj = yaml.load(file, yml, true);

        const rawRequestFlow = obj.rawRequestFlow;
        assert.ok(rawRequestFlow.body);
        const rawRequestFlowBody = JSON.parse(rawRequestFlow.body);
        assert.equal(rawRequestFlowBody.myGreeting, 'Hello');
        assert.equal(rawRequestFlowBody.myNumber, 1234);
        assert.equal(rawRequestFlowBody.myMissive, missive);

        const rawRequestBlock = obj.rawRequestBlock;
        assert.ok(rawRequestBlock.body);
        assert.equal(rawRequestBlock.body, rawRequestFlow.body);
        const rawRequestBlockBody = JSON.parse(rawRequestBlock.body);
        assert.equal(rawRequestBlockBody.myGreeting, 'Hello');
        assert.equal(rawRequestBlockBody.myNumber, 1234);
        assert.equal(rawRequestBlockBody.myMissive, missive);
    });

});
