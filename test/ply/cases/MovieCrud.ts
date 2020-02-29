import { suite, test } from '../../../src/decorators';

@suite('movie crud')
export class MovieCrud {

    public member = 'init member';

    constructor() {
        console.log('Instantiating MovieCrud: ' + this.member);
    }

    before() {
        console.log("THIS: " + this);
        this.member = 'next member';
    }

    @test('create')
    createMovie() {
        console.log('I am creating a movie: ' + this.member);
    }

    after() {
        this.member = 'after member';
    }
}
