import ply from '../../../src/index';
import { assert } from 'chai';
import { suite, test, before, after } from '../../../src/index';

@suite('movie-crud')
export class MovieCrud {

    movieId?: string;

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
        const requestSuite = await ply.loadSuite('test/ply/requests/movies-api.ply.yaml');
        const results = await requestSuite.run('createMovie', values);


        // TODO simplify the api for getting response body (and expressions in downstream requests)
        // this.movieId = result.invocation.response.body!).id;
        // ply.logger.info(`Created movie: id=${this.movieId}`);
    }

    @test('update rating')
    async updateRating(values: any) {
        const requestSuite = await ply.loadSuite('test/ply/requests/movies-api.ply.yaml');
        // update movie rating
        values.id = '435b30ad'; // TODO TODO TODO this.movieId;
        values.rating = 4.5;
        let results = await requestSuite.run('updateMovie', values);
        // confirm the update
        results = await requestSuite.run('retrieveMovie', values);
    }

    @test('remove movie')
    async deleteMovie(values: any) {
        const requestSuite = await ply.loadSuite('test/ply/requests/movies-api.ply.yaml');
        // delete movie
        await requestSuite.run('deleteMovie', values);
        // confirm the delete
        await requestSuite.run('retrieveMovie', values);
    }

    @after
    afterAll() {
    }
}
