import { TestType, Test } from './ply';

export class Case implements Test {
    type = 'case' as TestType;

    constructor(readonly suitePath: string, readonly suiteClass: string,
        readonly name: string, readonly method: string, readonly startLine: number = 0, readonly endLine?: number) {
    }

    get path() {
        return this.suitePath + '#' + this.name;
    }

    async run() {
        const testFile = '../test/ply/cases/MovieCrud';
        import(testFile).then(mod => {
            console.log("AFTER IMPORT");

        });
    }

}