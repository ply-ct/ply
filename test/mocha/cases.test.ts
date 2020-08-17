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

        assert.equal(suites[0].name, 'movie-crud');
        assert.equal(suites[0].className, 'MovieCrud');
        assert.equal(suites[0].type, 'case');
        assert.equal(suites[0].path, 'cases/movieCrud.ply.ts');
        assert.equal(suites[0].outFile, new Location('dist/test/ply/cases/movieCrud.ply.js').absolute);
    });

    it('is loaded from ts', async () => {
        const ply = new Ply();
        const suites = await ply.loadCases('test/ply/cases/movieCrud.ply.ts');

        assert.ok(suites.length === 1);
        assert.equal(suites[0].name, 'movie-crud');
        assert.equal(suites[0].className, 'MovieCrud');
        assert.equal(suites[0].type, 'case');
        assert.equal(suites[0].path, 'cases/movieCrud.ply.ts');
        assert.equal(suites[0].start, 4);

        const create = suites[0].get('add new movie') as PlyCase;
        const c2 = suites[0].tests['add new movie'];
        assert.deepEqual(create, c2);
        assert.equal(create.method, 'createMovie');
        assert.equal(create.type, 'case');
        assert.equal(create.start, 30);
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
        assert.equal(instance.beforeCount, 1);
        assert.deepEqual(instance.testsRun, ['unnamedCaseNoValues', 'unnamedCaseWithValues']);
        assert.equal(instance.aValue, 'foo');
        assert.equal(instance.afterCount, 1);

        assert.equal(results[0].name, 'unnamedCaseNoValues');
        assert.equal(results[0].status, 'Passed');
        assert.equal(results[1].name, 'unnamedCaseWithValues');
        assert.equal(results[1].status, 'Passed');
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
        assert.equal(instance.beforeCount, 3);
        assert.deepEqual(instance.testsRun, ['namedCaseNoValues', 'namedCaseWithValues']);
        assert.equal(instance.aValue, 'zero');
        assert.equal(instance.afterCount, 3);

        assert.equal(results[0].name, 'first case');
        assert.equal(results[0].status, 'Passed');
        assert.equal(results[1].name, 'second case');
        assert.equal(results[1].status, 'Passed');
    });

    it('can run suite', async () => {
        const ply = new Ply({
            ...new Config().options
        });
        const suites = await ply.loadCases(['test/ply/cases/movieCrud.ply.ts']);
        assert.equal(suites.length, 1);
        const suite = suites[0];

        const results = await suite.run(values);

        assert.equal(results[0].name, 'add new movie');
        assert.equal(results[0].status, 'Passed');
        assert.equal(results[1].name, 'update rating');
        assert.equal(results[1].status, 'Passed');
        assert.equal(results[2].name, 'remove movie');
        assert.equal(results[2].status, 'Passed');
    });

    it('can run plyee', async () => {
        const plier = new Plier();
        const results = await plier.run(['test/ply/cases/movieCrud.ply.ts#add new movie'], values);
        assert.equal(results[0].status, 'Passed');
        assert.equal(results[0].message, 'Test succeeded');
    });

    it('can run plyees', async () => {
        const plier = new Plier();
        const results = await plier.run([
            'test/ply/cases/movieCrud.ply.ts#add new movie',
            'test/ply/cases/movieCrud.ply.ts#update rating',
            'test/ply/cases/movieCrud.ply.ts#remove movie'
          ], values);
        assert.equal(results[0].status, 'Passed');
        assert.equal(results[0].message, 'Test succeeded');
        assert.equal(results[1].status, 'Passed');
        assert.equal(results[1].message, 'Test succeeded');
        assert.equal(results[2].status, 'Passed');
        assert.equal(results[2].message, 'Test succeeded');
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

        assert.equal(results[0].status, 'Errored');
        assert.equal(results[1].status, 'Errored');
        assert.equal(results[2].status, 'Errored');
    });

    it('honors NoVerify', async () => {
        const ply = new Ply({
            ...new Config().options,
            // real expected results don't live here
            expectedLocation: 'test/mocha/results/expected',
            actualLocation: 'test/mocha/results/actual'
        });

        const suites = await ply.loadCases(['test/ply/cases/movieCrud.ply.ts']);
        const suite = suites[0];
        const runOptions = { noVerify: true };
        const results = await suite.run(values, runOptions);

        assert.equal(results[0].status, 'Not Verified');
        assert.equal(results[1].status, 'Not Verified');
        assert.equal(results[2].status, 'Not Verified');
    });

});
