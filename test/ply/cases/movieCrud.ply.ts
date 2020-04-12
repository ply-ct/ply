import ply from '../../../src/index';
import { suite, test, before, after } from '../../../src/index';

@suite('movie crud')
export class MovieCrud {

    /**
     * Cleanup
     */
    @before
    async beforeAll(values: any) {
        console.log("BEFORE ALL");
        const requestSuite = await ply.loadSuite('test/ply/requests/movies-api.ply.yaml');
        // TODO results not captured for requests run from before or after
        requestSuite.run('deleteMovie', values);
    }

    @test('add new movie')
    async createMovie(values: any) {
        console.log("DURING");
        ply.logger.info('add new movie');

        // const values = { "baseUrl": "https://ply-ct.com/demo/api" };
        values.custom = 'my custom value';
        // ply.logger.debug('values: ' + JSON.stringify(values));

        // direct way through ply
        // await ply.run('test/ply/requests/movies-api.ply.yaml#createMovie', values);

        // through suite
        const requestSuite = await ply.loadSuite('test/ply/requests/movies-api.ply.yaml');
        // one way
        await requestSuite.run('createMovie', values);
        // other way
        // await requestSuite.runTest(requestSuite.get())


        // var postRequest = requestSuite.get('createMovie');

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

    @after
    afterAll() {
        console.log("AFTER ALL");
    }
}
