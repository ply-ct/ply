import * as path from 'path';
import * as process from 'process';
import { Location } from './location';
import { Logger } from './logger';
import { Retrieval } from './retrieval';
import { Storage } from './storage';
import { PlyOptions } from './options';

export class Runtime {

    testsLocation: Location;
    values: object = {};

    constructor(
        readonly locale: string,
        readonly options: PlyOptions,
        readonly logger: Logger,
        readonly retrieval: Retrieval,
        readonly expected: Retrieval,
        readonly actual: Storage) {

        if (path.isAbsolute(this.options.testsLocation)) {
            this.testsLocation = new Location(this.options.testsLocation);
        }
        else {
            this.testsLocation = new Location(path.resolve(process.cwd() + '/' + this.options.testsLocation));
        }
    }

    get suitePath(): string {
        return this.retrieval.location.relativeTo(this.options.testsLocation);
    }
}