import * as process from 'process';
import * as assert from 'assert';
import { Logger, LogLevel } from '../../src/logger';
import { Config } from '../../src/options';
import { Values } from '../../src/values';

describe('Values', () => {

    const logger = new Logger({ level: LogLevel.debug, prettyIndent: 2 });
    const options = new Config().options;


    it('should merge files', async () => {
        const locations = [
            'test/ply/values/localhost.json',
            'test/ply/values/global.json',
            'test/mocha/values/a.json',
            'test/mocha/values/b.json'
        ];

        const values = await new Values(locations, logger).read();

        assert.equal(values.baseUrl, 'http://localhost:8080/movies');
        assert.equal(values.year, 2020);
        assert.equal(values.rating, 10);
        assert.equal(values.query, 'year=1935&rating=>4&sort=rating&descending=true');
        const obj = values.obj;
        assert.ok(obj);
        assert.equal(obj.file, 'b.json');
        assert.equal(values.foo, 'bar');
    });

    it('should use config', async () => {

        const values = await new Values(options.valuesFiles, logger).read();

        assert.equal(values.baseUrl, 'http://localhost:3000/movies');
        assert.equal(values.year, 1931);
        assert.equal(values.rating, 5);
        assert.equal(values.query, 'year=1935&rating=>4&sort=rating&descending=true');
    });

    it('should honor PLY_VALUES', async () => {

        process.env.PLY_VALUES = '{ "rating": 1, "baseUrl": "http://localhost/movies" }';

        const values = await new Values(options.valuesFiles, logger).read();

        assert.equal(values.baseUrl, 'http://localhost/movies');
        assert.equal(values.year, 1931);
        assert.equal(values.rating, 1);
        assert.equal(values.query, 'year=1935&rating=>4&sort=rating&descending=true');
    });
});
