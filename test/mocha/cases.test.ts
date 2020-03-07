import * as assert from 'assert';
import * as ts from "typescript";
import { Options, Config } from '../../src/options';
import { Ply } from '../../src/ply';
import { CaseLoader } from '../../src/caseLoader';

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

    it('test decorators', () => {
        const testTs = 'test/ply/cases/movieCrud.ply.ts';

        const caseLoader = new CaseLoader([testTs], {
            target: ts.ScriptTarget.ES2018,
            module: ts.ModuleKind.CommonJS,
            experimentalDecorators: true,
            emitDecoratorMetadata: true
        });

        caseLoader.load();
    });

});
