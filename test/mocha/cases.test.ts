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

    });

});
