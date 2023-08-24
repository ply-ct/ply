import * as fs from 'fs';
import * as assert from 'assert';
import { Log, LogLevel } from '../../src/log';
import { Logger } from '../../src/logger';
import { Config } from '../../src/options';
import { ValuesBuilder, fromXlsx, fromCsv } from '../../src/values';

describe('Values', () => {
    const logger: Log = new Logger({ level: LogLevel.debug, prettyIndent: 2 });
    const options = new Config().options;

    it('should merge files', async () => {
        const locations = {
            'test/ply/values/localhost.json': true,
            'test/ply/values/global.json': true,
            'test/mocha/values/a.json': true,
            'test/mocha/values/b.json': true,
            'not/here/at/all.json': false
        };

        const values = await new ValuesBuilder(locations, logger).read();

        assert.strictEqual(values.baseUrl, 'http://localhost:8080/movies');
        assert.strictEqual(values.year, 2020);
        assert.strictEqual(values.rating, 10);
        assert.strictEqual(values.query, 'year=1935&rating=>4&sort=rating&descending=true');
        const obj = values.obj;
        assert.ok(obj);
        assert.strictEqual(obj.file, 'b.json');
        assert.strictEqual(values.foo, 'bar');
    });

    it('should use config', async () => {
        const values = await new ValuesBuilder(options.valuesFiles, logger).read();

        assert.strictEqual(values.baseUrl, 'http://localhost:3000');
        assert.strictEqual(values.year, 1931);
        assert.strictEqual(values.rating, 5);
        assert.strictEqual(values.query, 'year=1935&rating=>4&sort=rating&descending=true');
    });

    it('should parse csv', async () => {
        const rows = await fromCsv('test/mocha/values/csv.csv');
        assert.strictEqual(rows.length, 2);
        const row0 = JSON.parse(fs.readFileSync('test/mocha/values/csv0.json', 'utf8'));
        assert.deepStrictEqual(rows[0], row0);
        const row1 = JSON.parse(fs.readFileSync('test/mocha/values/csv1.json', 'utf8'));
        assert.deepStrictEqual(rows[1], row1);
    });

    it('should stream csv', async () => {
        const values = new ValuesBuilder(
            { ...options.valuesFiles, 'test/mocha/values/movies.csv': true },
            logger
        );

        const rowValues = [];
        for await (const rowVals of await values.getRowStream()) {
            rowValues.push(rowVals);
        }

        assert.strictEqual(rowValues.length, 3);
        assert.strictEqual(rowValues[1].year, 1934);
        assert.strictEqual(rowValues[1].rating, 4);
        assert.strictEqual(rowValues[1].title, 'The Case of the Howling Dog');
        assert.strictEqual(rowValues[1].description, undefined);
        assert.strictEqual(rowValues[1].credits.length, 6);
        assert.strictEqual(rowValues[1].credits[0].name, 'Alan Crosland');
        assert.strictEqual(rowValues[1].credits[0].role, 'director');
        // global value
        assert.strictEqual(rowValues[1].query, 'year=1935&rating=>4&sort=rating&descending=true');
    });

    it('should read from xlsx', async () => {
        const rows = await fromXlsx('test/mocha/values/xlsx.xlsx');
        assert.strictEqual(rows.length, 2);
        const row0 = JSON.parse(fs.readFileSync('test/mocha/values/csv0.json', 'utf8'));
        assert.deepStrictEqual(rows[0], row0);
        const row1 = JSON.parse(fs.readFileSync('test/mocha/values/csv1.json', 'utf8'));
        assert.deepStrictEqual(rows[1], row1);
    });

    it('should stream xlsx', async () => {
        const values = new ValuesBuilder(
            { ...options.valuesFiles, 'test/mocha/values/movies.xlsx': true },
            logger
        );

        const rowValues = [];
        for await (const rowVals of await values.getRowStream()) {
            rowValues.push(rowVals);
        }

        assert.strictEqual(rowValues.length, 3);
        assert.strictEqual(rowValues[1].year, 1934);
        assert.strictEqual(rowValues[1].rating, 4);
        assert.strictEqual(rowValues[1].title, 'The Case of the Howling Dog');
        assert.strictEqual(rowValues[1].description, null);
        // global value
        assert.strictEqual(rowValues[1].query, 'year=1935&rating=>4&sort=rating&descending=true');
    });
});
