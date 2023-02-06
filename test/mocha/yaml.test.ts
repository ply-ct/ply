import * as fs from 'fs';
import * as assert from 'assert';
import * as yaml from '../../src/yaml';
import { Retrieval } from '../../src/retrieval';
import * as util from '../../src/util';

describe('yaml', () => {
    it('assigns line numbers', async () => {
        const retrieval = new Retrieval('test/ply/requests/movie-queries.ply.yaml');
        const yml = await retrieval.read();
        const obj = yaml.load(retrieval.toString(), yml!, true);

        assert.strictEqual(obj['moviesByYearAndRating'].__start, 0);
        assert.strictEqual(obj['moviesByYearAndRating'].__end, 4);
        assert.strictEqual(obj['movieById'].__start, 6);
        assert.strictEqual(obj['movieById'].__end, 11);
        assert.strictEqual(obj['moviesQuery'].__start, 14);
        assert.strictEqual(obj['moviesQuery'].__end, 18);
    });

    it('assigns line nums of empty keys', () => {
        const file = 'test/mocha/results/expected/UnnamedSuite.yaml';
        const yml = fs.readFileSync(file, 'utf-8');
        const obj = yaml.load(file, yml, true);

        assert.strictEqual(obj['unnamedCaseNoValues'].__start, 0);
        assert.strictEqual(obj['unnamedCaseNoValues'].__end, 0);
        assert.strictEqual(obj['unnamedCaseWithValues'].__start, 1);
        assert.strictEqual(obj['unnamedCaseWithValues'].__end, 1);
    });

    it('assigns line nums of single obj', () => {
        const file = 'test/mocha/results/expected/single.yaml';
        const yml = fs.readFileSync(file, 'utf-8');
        const obj = yaml.load(file, yml, true);

        assert.strictEqual(obj['aSingle'].__start, 0);
        assert.strictEqual(obj['aSingle'].__end, 9);
    });

    it('assigns line nums of mixed objs', () => {
        const file = 'test/mocha/results/expected/foobar.yaml';
        const yml = fs.readFileSync(file, 'utf-8');
        const obj = yaml.load(file, yml, true);

        assert.strictEqual(obj['foo'].__start, 2);
        assert.strictEqual(obj['foo'].__end, 11);
        assert.strictEqual(obj['bar'].__start, 14);
        assert.strictEqual(obj['bar'].__end, 14);
        assert.strictEqual(obj['baz'].__start, 17);
        assert.strictEqual(obj['baz'].__end, 18);
    });

    it('handles escaped string content', async () => {
        const missive = 'Dear Sir,\n\nGo jump in the "lake".\n\n - A Friend';

        const file = 'test/mocha/requests/raw-requests.ply.yaml';
        const yml = fs.readFileSync(file, 'utf-8');
        const obj = yaml.load(file, yml, true);

        const rawRequestFlow = obj.rawRequestFlow;
        assert.ok(rawRequestFlow.body);
        const rawRequestFlowBody = JSON.parse(rawRequestFlow.body);
        assert.strictEqual(rawRequestFlowBody.myGreeting, 'Hello');
        assert.strictEqual(rawRequestFlowBody.myNumber, 1234);
        assert.strictEqual(rawRequestFlowBody.myMissive, missive);

        const rawRequestBlock = obj.rawRequestBlock;
        assert.ok(rawRequestBlock.body);
        assert.strictEqual(rawRequestBlock.body, rawRequestFlow.body);
        const rawRequestBlockBody = JSON.parse(rawRequestBlock.body);
        assert.strictEqual(rawRequestBlockBody.myGreeting, 'Hello');
        assert.strictEqual(rawRequestBlockBody.myNumber, 1234);
        assert.strictEqual(rawRequestBlockBody.myMissive, missive);
    });

    it('dumps yaml xml multiline string literal from win eols', async () => {
        const xml = await fs.promises.readFile('test/mocha/results/res.xml', { encoding: 'utf-8' });
        const xmlWithWindowsNewlines = xml.replace(/\n/g, '\r\n');
        const yamlObj = {
            myTest: {
                response: {
                    status: {
                        code: 200,
                        message: 'OK'
                    },
                    headers: {
                        'content-type': 'application/xml'
                    },
                    body: util.fixEol(xmlWithWindowsNewlines)
                }
            }
        };

        const yml = yaml.dump(yamlObj, 2);
        const lines = util.lines(yml);
        assert.strictEqual(
            lines[8],
            '      <?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
        );
    });

    it('merges yaml deltas', async () => {
        const beforeFile = 'test/mocha/yaml/before.yaml';
        const beforeYaml = await fs.promises.readFile(beforeFile, {
            encoding: 'utf-8'
        });

        const delta = {
            last: {
                should: 'be new',
                yet: 'have more'
            },
            bar: 'new value',
            newbie: {
                greeting: 'hello'
            },
            disappearingObj: undefined,
            disappearingInt: undefined,
            newNull: null
        };

        const result = yaml.merge(beforeFile, beforeYaml, delta, 2);
        const resultLines = util.lines(result);

        const afterFile = 'test/mocha/yaml/after.yaml';
        const afterYaml = await fs.promises.readFile(afterFile, {
            encoding: 'utf-8'
        });
        const afterLines = util.lines(afterYaml);

        for (let i = 0; i < afterLines.length; i++) {
            assert.strictEqual(resultLines[i], afterLines[i]);
        }
    });
});
