import { Ply } from '../../../src/ply';
import { Options, Config } from '../../../src/options';
import { Suite } from '../../../src/suite';
import { Request } from '../../../src/request';
import { Logger, LogLevel } from '../../../src/logger';
import { suite, test } from '../../../src/decorators';

@suite('movie crud')
export class MovieCrud {

    readonly ply: Ply;
    readonly logger: Logger;

    constructor() {
        const options: Options = new Config().options;
        this.ply = new Ply(options);
        this.logger = new Logger({
            level: options.verbose ? LogLevel.debug : LogLevel.info,
            location: options.logLocation
        });
    }

    get requestSuite(): Promise<Suite<Request>> {
        return (async () => {
            this.logger.info('Loading requests');
            const suites = await this.ply.loadRequests([
                'test/ply/requests/movies-api.ply.yaml'
            ]);
            return suites[0];
        })();
    }

    async before() {
        // TODO: clean up leftover movie
    }

    @test('create')
    async createMovie() {
        this.logger.debug('createMovie');
        var post = (await this.requestSuite).get('createMovie');
        if (!post) {
            throw Error('createMovie not found');
        }

        post.ply();
    }

    @test('read')
    async readMovie() {

    }

    after() {
    }
}
