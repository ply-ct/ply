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

    @test('create movie')
    async createMovie() {
        ply.logger.debug('create movie');
        const requestSuite = await ply.loadRequestSuite('test/ply/requests/movies-api.ply.yaml');
        var postRequest = requestSuite.get('createMovie');

        // post.run();
    }

    @test('retrieve movie')
    async retrieveMovie() {
        ply.logger.debug('retrieve movie');
        const requestSuite = await ply.loadRequestSuite('test/ply/requests/movies-api.ply.yaml');
        var getRequest = requestSuite.get('retrieveMovie');
        if (!getRequest) {
            throw Error('retrieveMovie not found');
        }
        const values = {
            "baseUrl": "https://ply-ct.com/demo/api",
            "id": "435b30ad"
        };
        const response = await getRequest.submit(values);
        ply.logger.info("RESPONSE: " + JSON.stringify(response, null, 2));
        console.log("MADE IT HERE");
        ply.logger.info("YES I DID");
        // throw new Error("WTF");
    }

    after() {
    }
}
