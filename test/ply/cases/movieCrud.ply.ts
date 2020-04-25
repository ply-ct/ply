import ply from '../../../src/index';
import { assert } from 'chai';
import { suite, test, before, after } from '../../../src/index';

@suite('movie crud')
export class MovieCrud {

    /**
     * Cleanup movie left over from previous tests.
     */
    @before
    async beforeAll(values: any) {
        const requestSuite = await ply.loadSuite('test/ply/requests/movies-api.ply.yaml');
        const deleteMovie = requestSuite.get('deleteMovie');
        if (!deleteMovie) {
            throw new Error('Request deleteMovie not found');
        }
        const response = await deleteMovie.submit(values);
        ply.logger.info('Cleanup response status code', response.status.code);
        // response status should either be 200 or 404 (we don't care which during cleanup)
        assert.ok(response.status.code === 200 || response.status.code === 404);
    }

    @test('add new movie')
    async createMovie(values: any) {
        ply.logger.info('adding new movie');

        values.custom = 'my custom value';
        ply.logger.debug('values: ' + JSON.stringify(values));

        const requestSuite = await ply.loadSuite('test/ply/requests/movies-api.ply.yaml');
        await requestSuite.run('createMovie', values);
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
    }
}
