import * as path from 'path';
import * as process from 'process';
import { Location } from './location';
import { Logger } from './logger';
import { Retrieval } from './retrieval';
import { Storage } from './storage';

export class Runtime {

    testsLocation: Location;

    constructor(
        testsLocation: string,
        readonly logger: Logger,
        readonly retrieval: Retrieval,
        readonly expected: Retrieval,
        readonly actual: Storage) {

        if (path.isAbsolute(testsLocation)) {
            this.testsLocation = new Location(testsLocation);
        }
        else {
            this.testsLocation = new Location(path.resolve(process.cwd() + '/' + testsLocation));
        }
    }
}