import * as assert from 'assert';
import { PlyOptions, Config } from '../../src/options';
import { Ply } from '../../src/ply';

describe('Cases', async () => {

    it('is loaded from ts', async () => {
        const options: PlyOptions = new Config().options;
        const ply = new Ply(options);
        const suites = await ply.loadCases([
            'test/ply/cases/movieCrud.ply.ts'
        ]);

        assert.ok(suites.length === 1);
        assert.equal(suites[0].name, 'movie crud');
        assert.equal(suites[0].type, 'case');
        assert.equal(suites[0].path, 'cases/movieCrud.ply.ts');
        assert.equal(suites[0].line, 3);
        const suiteRetrieval = suites[0].retrieval;
        assert.equal(suiteRetrieval.location.path, 'test/ply/cases/movieCrud.ply.ts');

        const create = suites[0].get('create movie');
        assert.ok(create);
        const c2 = suites[0].tests['create movie'];
        assert.deepEqual(create, c2);
        assert.equal(create?.suitePath, suites[0].path);
        assert.equal(create?.suiteClass, 'MovieCrud');
        assert.equal(create?.method, 'createMovie');
        assert.equal(create?.type, 'case');
        assert.equal(create?.startLine, 17);
    });

    it('can run retrieve', async () => {
        const options: PlyOptions = new Config().options;
        const ply = new Ply(options);
        const suites = await ply.loadCases(['test/ply/cases/movieCrud.ply.ts']);
        assert.equal(suites.length, 1);
        let testCase = suites[0].get('retrieve movie')!;


        const globalValues = {}

        const response = await testCase.run(options, globalValues);
        assert.equal(response.status.code, 200);
        assert.equal(response.headers['content-type'], 'application/json');
    });
});
