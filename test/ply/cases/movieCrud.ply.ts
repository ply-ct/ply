import ply from '../../../src/index';
import { suite, test } from '../../../src/index';

@suite('movie crud')
export class MovieCrud {

    constructor() {
    }


    /**
     * TODO: @before annotation
     */
    // @before()
    async before(values: any) {
        console.log("STATIC BEFORE");
        const requestSuite = await ply.loadSuite('test/ply/requests/movies-api.ply.yaml');

        // TODO results not captured for requests run from before or after
        requestSuite.run('deleteMovie', values);

        // cleanup
        const deleteRequest = requestSuite.get('deleteMovie');
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

    // @after
    // async after() {
    //     console.log("INSTANCE AFTER");
    // }
}
