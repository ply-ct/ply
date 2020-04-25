import * as assert from 'assert';
import { PlyOptions, Config } from '../../src/options';
import { Ply } from '../../src/ply';
import { PlyCase } from '../../src/case';
import { Runtime } from '../../src/runtime';
import { UnnamedSuite } from './suites';

describe('Cases', async () => {

    it('is loaded from ts', async () => {
        const options: PlyOptions = new Config().options;
        const ply = new Ply(options);
        const suites = await ply.loadCases('test/ply/cases/movieCrud.ply.ts');

        assert.ok(suites.length === 1);
        assert.equal(suites[0].name, 'movie crud');
        assert.equal(suites[0].className, 'MovieCrud');
        assert.equal(suites[0].type, 'case');
        assert.equal(suites[0].path, 'cases/movieCrud.ply.ts');
        assert.equal(suites[0].startLine, 3);

        const create = suites[0].get('add new movie') as PlyCase;
        const c2 = suites[0].tests['add new movie'];
        assert.deepEqual(create, c2);
        assert.equal(create.method, 'createMovie');
        assert.equal(create.type, 'case');
        assert.equal(create.startLine, 20);
    });

    it('can run unnamed suite', async () => {
        const options: PlyOptions = new Config().options;
        const ply = new Ply(options);
        const suites = await ply.loadCases('test/mocha/suites.ts');
        const unnamedSuite = suites[0];
        const values = { myValue: 'foo', otherValue: 'bar' };
        const result = await unnamedSuite.run(values);

        const instance = ((unnamedSuite as any).runtime as Runtime).decoratedSuite!.instance as UnnamedSuite;
        assert.equal(instance.beforeCount, 1);
        assert.deepEqual(instance.testsRun, ['unnamedCaseNoValues', 'unnamedCaseWithValues']);
        assert.equal(instance.aValue, 'foo');
        assert.equal(instance.afterCount, 1);
    });

    it('can run named suite', async () => {
        const options: PlyOptions = new Config().options;
        const ply = new Ply(options);
        const suites = await ply.loadCases('test/mocha/suites.ts');
        const unnamedSuite = suites[1];
        const values = { myValue: 'zero', otherValue: 'bar' };
        const result = await unnamedSuite.run(values);

        const instance = ((unnamedSuite as any).runtime as Runtime).decoratedSuite!.instance as UnnamedSuite;
        assert.equal(instance.beforeCount, 3);
        assert.deepEqual(instance.testsRun, ['namedCaseNoValues', 'namedCaseWithValues']);
        assert.equal(instance.aValue, 'zero');
        assert.equal(instance.afterCount, 3);
    });

    it('can run real one', async () => {
        const options: PlyOptions = new Config().options;
        // options not used because movieCrud.ply.ts loads ply
        // how to handle this?
        const ply = new Ply({ ...options, verbose: true });
        const suites = await ply.loadCases(['test/ply/cases/movieCrud.ply.ts']);
        assert.equal(suites.length, 1);
        const suite = suites[0];

        const values = {
            baseUrl: 'http://localhost:8080/ply-demo/api',
            id: '435b30ad'
        };
        const result = await suite.run(values);

        // const outcome = result.outcomes[0];
        // assert.equal(outcome.response.status.code, 200);
        // assert.equal(outcome.response.headers['content-type'], 'application/json');
    });
});
