import { suite, test, before, after } from '../../src/decorators';

// decorators are applied when module is loaded (imported)

@suite
export class UnnamedSuite {

    beforeCount = 0;
    afterCount = 0;
    aValue: any;

    @before
    beforeAll() {
        this.beforeCount++;
    }

    @test
    unnamedCaseNoValues() {

    }

    @test
    unnamedCaseWithValues(values: any) {
        this.aValue = values.myValue;
    }

    @after
    afterAll() {
        this.afterCount++;
    }
}

@suite('my suite name')
export class NamedSuite {

    beforeCount = 0;
    afterCount = 0;
    aValue: any;

    @before
    beforeAll() {
        this.beforeCount++;
    }

    @before('*')
    beforeEach() {
        this.beforeCount++;
    }

    @test('first case')
    namedCaseNoValues() {

    }

    @test('second case')
    namedCaseWithValues(values: any) {
        this.aValue = values.myValue;
    }

    @after('*')
    afterEach() {
        this.afterCount++;
    }

    @after
    afterAll() {
        this.afterCount++;
    }
}
