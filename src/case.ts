import { TestType, Test } from './test';
import { Response } from './response';

export class Case implements Test {
    type = 'case' as TestType;

    constructor(readonly suitePath: string, readonly suiteClass: string,
        readonly name: string, readonly method: string, readonly startLine: number = 0, readonly endLine?: number) {
    }

    get path() {
        return this.suitePath + '#' + this.name;
    }

    async run(values: object): Promise<Response> {
        const testFile = '../test/ply/cases/MovieCrud';
        import(testFile).then(mod => {
            console.log("AFTER IMPORT");

        });
        return new Response(
            { code: 200, message: 'ok' },
            {},
            '',
            0
        );
    }

}