import ply from '../../../src/index';
import { suite, test } from '../../../src/index';

@suite('movie crud')
export class MovieCrud {

    constructor() {
    }


    /**
     * Static before() is called just once before any test case runs.
     */
    static async before() {
        // TODO: clean up leftover movie
    }

    @test('add new movie')
    async createMovie() {
        ply.logger.debug('add new movie');
        const requestSuite = await ply.loadRequestSuite('test/ply/requests/movies-api.ply.yaml');
        var postRequest = requestSuite.get('createMovie');

        // post.run();
    }

    @test('update rating')
    async updateRating() {
        // two requests: update and confirm

    }

    @test('removeMovie')
    async deleteMovie() {
        // two requests: delete and confirm
    }

    after() {
    }
}
