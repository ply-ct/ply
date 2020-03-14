import * as assert from 'assert';
import { Options, Config } from '../../src/options';
import { Ply } from '../../src/ply';

describe('Cases', async () => {

    it('is loaded from ts', async () => {
        const options: Options = new Config().options;
        const ply = new Ply(options);
        const suites = await ply.loadCases([
            'test/ply/cases/movieCrud.ply.ts'
        ]);

        assert.ok(suites.length === 1);
        assert.equal(suites[0].name, 'movie crud');
        assert.equal(suites[0].type, 'case');
        assert.equal(suites[0].path, 'cases/movieCrud.ply.ts');
        assert.equal(suites[0].line, 7);
        const suiteRetrieval = suites[0].retrieval;
        assert.equal(suiteRetrieval.location.path, 'test/ply/cases/movieCrud.ply.ts');

        const create = suites[0].get('create');
        assert.ok(create);
        const c2 = suites[0].tests['create'];
        assert.deepEqual(create, c2);
        assert.equal(create?.suitePath, suites[0].path);
        assert.equal(create?.suiteClass, 'MovieCrud');
        assert.equal(create?.method, 'createMovie');
        assert.equal(create?.type, 'case');
        assert.equal(create?.line, 36);
    });

});
