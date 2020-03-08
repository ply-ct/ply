import { TestType, Plyable } from './ply';
import { Suite } from './suite';

export class Case implements Plyable {
    type = 'case' as TestType;

    constructor(readonly suite: string, readonly suiteClass: string,
        readonly name: string, readonly method: string, readonly line: number = 0) {
    }

    async ply() {
        const testFile = '../test/ply/cases/MovieCrud';
        import(testFile).then(mod => {
            console.log("AFTER IMPORT");

        });
    }

}