import * as assert from 'assert';
import { PlyOptions, Config } from '../../src/options';
import { Ply } from '../../src/ply';
import { PlyCase } from '../../src/case';

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
        const suiteRetrieval = suites[0].runtime.retrieval;
        assert.equal(suiteRetrieval.location.path, 'test/ply/cases/movieCrud.ply.ts');

        const create = suites[0].get('add new movie') as PlyCase;
        const c2 = suites[0].tests['add new movie'];
        assert.deepEqual(create, c2);
        assert.equal(create.suiteClass, 'MovieCrud');
        assert.equal(create.method, 'createMovie');
        assert.equal(create.type, 'case');
        assert.equal(create.startLine, 17);
    });

    it('can run one', async () => {
        const options: PlyOptions = new Config().options;
        // options not used because movieCrud.ply.ts loads ply
        // how to handle this?
        const ply = new Ply({ ...options, verbose: true });
        const suites = await ply.loadCases(['test/ply/cases/movieCrud.ply.ts']);
        assert.equal(suites.length, 1);
        const suite = suites[0];

        const values = { "baseUrl": "https://ply-ct.com/demo/api" };
        const result = await suite.run('add new movie', values);

        // const outcome = result.outcomes[0];
        // assert.equal(outcome.response.status.code, 200);
        // assert.equal(outcome.response.headers['content-type'], 'application/json');
    });
});
