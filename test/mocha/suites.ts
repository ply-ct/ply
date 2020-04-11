import { suite, test } from '../../src/decorators';

// decorators are applied when module is loaded (imported)

@suite
export class SuiteNoArgs {

    constructor() {
        console.log('SuiteNoArgs constructor');
    }

}

@suite('my suite name')
export class SuiteWithArgs {

    constructor() {
        console.log('SuiteWithArgs constructor');
    }

}

const suiteWithArgs = new SuiteWithArgs();