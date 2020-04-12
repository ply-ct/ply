import { suite, test, before, after } from '../../src/decorators';

const sleep = (millis: number) => {
    return new Promise(resolve => setTimeout(resolve, millis));
};

@suite
export class UnnamedSuite {

    beforeCount = 0;
    afterCount = 0;
    aValue: any;
    testsRun: string[] = [];

    @before
    beforeAll() {
        this.beforeCount++;
    }

    @test
    async unnamedCaseNoValues() {
        this.testsRun.push('unnamedCaseNoValues');
    }

    @test
    async unnamedCaseWithValues(values: any) {
        this.aValue = values.myValue;
        await sleep(500);
        this.testsRun.push('unnamedCaseWithValues');
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
    testsRun: string[] = [];

    @before
    async beforeAll() {
        this.beforeCount++;
    }

    @before('*')
    beforeEach() {
        this.beforeCount++;
    }

    @test('first case')
    namedCaseNoValues() {
        this.testsRun.push('namedCaseNoValues');
    }

    @test('second case')
    async namedCaseWithValues(values: any) {
        this.aValue = values.myValue;
        await sleep(300);
        this.testsRun.push('namedCaseWithValues');
    }

    @after('*')
    async afterEach() {
        this.afterCount++;
    }

    @after
    afterAll() {
        this.afterCount++;
    }
}
