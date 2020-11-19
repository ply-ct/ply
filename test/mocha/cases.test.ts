import * as assert from 'assert';
import { Config } from '../../src/options';
import { TsCompileOptions } from '../../src/compile';
import { Location } from '../../src/location';
import { Ply, Plier } from '../../src/ply';
import { CaseLoader } from '../../src/cases';
import { PlyCase } from '../../src/case';
import { Runtime } from '../../src/runtime';
import { Storage } from '../../src/storage';
import { UnnamedSuite } from './suites';

const values = {
    baseUrl: 'http://localhost:3000/movies'
};

describe('Cases', async () => {

    beforeEach(() => {
        const missingExpected = new Storage('test/mocha/results/expected/cases/movie-crud.yaml');
        if (missingExpected.exists) {
            missingExpected.remove();
        }
    });

    it('is found by case loader', async () => {
        const options = new Config().options;
        const files = ['test/ply/cases/movieCrud.ply.ts'];
        const compileOptions = new TsCompileOptions(options);
        const caseLoader = new CaseLoader(files, options, compileOptions);
        const suites = await caseLoader.load();

        assert.strictEqual(suites[0].name, 'movie-crud');
        assert.strictEqual(suites[0].className, 'MovieCrud');
        assert.strictEqual(suites[0].type, 'case');
        assert.strictEqual(suites[0].path, 'cases/movieCrud.ply.ts');
        assert.strictEqual(suites[0].outFile, new Location('dist/test/ply/cases/movieCrud.ply.js').absolute);
    });

    it('is loaded from ts', async () => {
        const ply = new Ply();
        const suites = await ply.loadCases('test/ply/cases/movieCrud.ply.ts');

        assert.ok(suites.length === 1);
        assert.strictEqual(suites[0].name, 'movie-crud');
        assert.strictEqual(suites[0].className, 'MovieCrud');
        assert.strictEqual(suites[0].type, 'case');
        assert.strictEqual(suites[0].path, 'cases/movieCrud.ply.ts');
        assert.strictEqual(suites[0].start, 4);

        const create = suites[0].get('add new movie') as PlyCase;
        const c2 = suites[0].tests['add new movie'];
        assert.deepEqual(create, c2);
        assert.strictEqual(create.method, 'createMovie');
        assert.strictEqual(create.type, 'case');
        assert.strictEqual(create.start, 30);
    });

    it('can run unnamed suite', async () => {
        const ply = new Ply({
            ...new Config().options,
            expectedLocation: 'test/mocha/results/expected',
            actualLocation: 'test/mocha/results/actual'
        });
        const suites = await ply.loadCases('test/mocha/suites.ts');
        const unnamedSuite = suites[0];
        const results = await unnamedSuite.run({ myValue: 'foo', otherValue: 'bar' });

        const instance = ((unnamedSuite as any).runtime as Runtime).decoratedSuite!.instance as UnnamedSuite;
        assert.strictEqual(instance.beforeCount, 1);
        assert.deepEqual(instance.testsRun, ['unnamedCaseNoValues', 'unnamedCaseWithValues']);
        assert.strictEqual(instance.aValue, 'foo');
        assert.strictEqual(instance.afterCount, 1);

        assert.strictEqual(results[0].name, 'unnamedCaseNoValues');
        assert.strictEqual(results[0].status, 'Passed');
        assert.strictEqual(results[1].name, 'unnamedCaseWithValues');
        assert.strictEqual(results[1].status, 'Passed');
    });

    it('can run named suite', async () => {
        const ply = new Ply({
            ...new Config().options,
            expectedLocation: 'test/mocha/results/expected',
            actualLocation: 'test/mocha/results/actual'
        });
        const suites = await ply.loadCases('test/mocha/suites.ts');
        const unnamedSuite = suites[1];
        const results = await unnamedSuite.run({ myValue: 'zero', otherValue: 'bar' });

        const instance = ((unnamedSuite as any).runtime as Runtime).decoratedSuite!.instance as UnnamedSuite;
        assert.strictEqual(instance.beforeCount, 3);
        assert.deepEqual(instance.testsRun, ['namedCaseNoValues', 'namedCaseWithValues']);
        assert.strictEqual(instance.aValue, 'zero');
        assert.strictEqual(instance.afterCount, 3);

        assert.strictEqual(results[0].name, 'first case');
        assert.strictEqual(results[0].status, 'Passed');
        assert.strictEqual(results[1].name, 'second case');
        assert.strictEqual(results[1].status, 'Passed');
    });

    it('can run suite', async () => {
        const ply = new Ply({
            ...new Config().options
        });
        const suites = await ply.loadCases(['test/ply/cases/movieCrud.ply.ts']);
        assert.strictEqual(suites.length, 1);
        const suite = suites[0];

        const results = await suite.run(values, { createExpectedIfMissing: true });

        assert.strictEqual(results[0].name, 'add new movie');
        assert.strictEqual(results[0].status, 'Passed');
        assert.strictEqual(results[1].name, 'update rating');
        assert.strictEqual(results[1].status, 'Passed');
        assert.strictEqual(results[2].name, 'remove movie');
        assert.strictEqual(results[2].status, 'Passed');
    });

    it('can run plyee', async () => {
        const plier = new Plier();
        const results = await plier.run(['test/ply/cases/movieCrud.ply.ts#add new movie'], values);
        assert.strictEqual(results[0].status, 'Passed');
        assert.strictEqual(results[0].message, 'Test succeeded');
    });

    it('can run plyees', async () => {
        const plier = new Plier();
        const results = await plier.run([
            'test/ply/cases/movieCrud.ply.ts#add new movie',
            'test/ply/cases/movieCrud.ply.ts#update rating',
            'test/ply/cases/movieCrud.ply.ts#remove movie'
          ], values);
        assert.strictEqual(results[0].status, 'Passed');
        assert.strictEqual(results[0].message, 'Test succeeded');
        assert.strictEqual(results[1].status, 'Passed');
        assert.strictEqual(results[1].message, 'Test succeeded');
        assert.strictEqual(results[2].status, 'Passed');
        assert.strictEqual(results[2].message, 'Test succeeded');
    });

    it('can handle error', async () => {
        const ply = new Ply({
            ...new Config().options,
            // real expected results don't live here
            expectedLocation: 'test/mocha/results/expected',
            actualLocation: 'test/mocha/results/actual'
        });

        const suites = await ply.loadCases(['test/ply/cases/movieCrud.ply.ts']);
        const suite = suites[0];
        const results = await suite.run(values);

        assert.strictEqual(results[0].status, 'Errored');
        assert.strictEqual(results[1].status, 'Errored');
        assert.strictEqual(results[2].status, 'Errored');
    });

    it('honors submit', async () => {
        const ply = new Ply({
            ...new Config().options,
            // real expected results don't live here
            expectedLocation: 'test/mocha/results/expected',
            actualLocation: 'test/mocha/results/actual'
        });

        const suites = await ply.loadCases(['test/ply/cases/movieCrud.ply.ts']);
        const suite = suites[0];
        const runOptions = { submit: true };
        const results = await suite.run(values, runOptions);

        assert.strictEqual(results[0].status, 'Submitted');
        assert.strictEqual(results[1].status, 'Submitted');
        assert.strictEqual(results[2].status, 'Submitted');
    });

});
