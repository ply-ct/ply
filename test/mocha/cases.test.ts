import * as assert from 'assert';
import { Config } from '../../src/options';
import { Ply } from '../../src/ply';
import { PlyCase } from '../../src/case';
import { Runtime } from '../../src/runtime';
import { UnnamedSuite } from './suites';

describe('Cases', async () => {

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
        assert.equal(create.start, 23);
    });

    it('can run unnamed suite', async () => {
        const ply = new Ply({
            ...new Config().options,
            expectedLocation: 'test/mocha/results/expected',
            actualLocation: 'test/mocha/results/actual'
        });
        const suites = await ply.loadCases('test/mocha/suites.ts');
        const unnamedSuite = suites[0];
        const values = { myValue: 'foo', otherValue: 'bar' };
        const results = await unnamedSuite.run(values);

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
        const values = { myValue: 'zero', otherValue: 'bar' };
        const results = await unnamedSuite.run(values);

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
            ...new Config().options,
            verbose: false
        });
        const suites = await ply.loadCases(['test/ply/cases/movieCrud.ply.ts']);
        assert.equal(suites.length, 1);
        const suite = suites[0];

        const values = {
            baseUrl: 'http://localhost:3000/movies',
            id: '435b30ad'  // TODO expected should reference location header or body.id
        };
        const results = await suite.run(values);

        assert.equal(results[0].name, 'add new movie');
        assert.equal(results[0].status, 'Passed');
        assert.equal(results[1].name, 'update rating');
        assert.equal(results[1].status, 'Passed');
        assert.equal(results[2].name, 'remove movie');
        assert.equal(results[2].status, 'Passed');

        // TODO this case won't pass until body properties are ordered
    });
});
