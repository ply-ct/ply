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

        const suite = suites[0];

        console.log("SUITE: " + JSON.stringify(suite, null, 2));
    });

    it('test decorators', async () => {
        const options: Options = new Config().options;
        const ply = new Ply(options);
        const suites = await ply.loadCases([
            'test/ply/cases/movieCrud.ply.ts'
        ]);
    });

});

describe('Other', async () => {

    it('does suck', async () => {
        console.log("THIS SUCKS");
    });
});