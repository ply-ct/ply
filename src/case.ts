import { TestType, Plyable } from './ply';

export class Case implements Plyable {
    type = 'case' as TestType;

    constructor(readonly suitePath: string, readonly suiteClass: string,
        readonly name: string, readonly method: string, readonly line: number = 0) {
    }

    get path() {
        return this.suitePath + '#' + this.name;
    }

    async ply() {
        const testFile = '../test/ply/cases/MovieCrud';
        import(testFile).then(mod => {
            console.log("AFTER IMPORT");

        });
    }

}