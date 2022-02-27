import { suite, test } from '../../src/decorators';

@suite('skip this suite')
export class IgnoredSuite {
    @test("won't be run")
    wontBeRun() {
        throw new Error('I should not be run');
    }
}
