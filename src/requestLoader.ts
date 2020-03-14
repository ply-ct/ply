import { PlyOptions } from './options';
import { Suite } from './suite';
import { Location } from './location';
import { Retrieval } from './retrieval';
import { Request } from './request';
import { Storage } from './storage';
import * as yaml from './yaml';

export class RequestLoader {

    constructor(readonly locations: string[], private options: PlyOptions) {
    }

    async load(): Promise<Suite<Request>[]> {
        const retrievals = this.locations.map(loc => new Retrieval(loc));
        // load request files in parallel
        const promises = retrievals.map(retr => this.loadRequestSuite(retr));
        return Promise.all(promises);
    }

    async loadRequestSuite(retrieval: Retrieval): Promise<Suite<Request>> {

        const contents = await retrieval.read();
        if (!contents) {
            throw new Error('Cannot retrieve: ' + retrieval.location.absolute);
        }

        const relPath = retrieval.location.relativeTo(this.options.testsLocation);
        const resultFilePath = new Location(relPath).parent + '/' + retrieval.location.base + '.' + retrieval.location.ext;

        const suite = new Suite<Request>(
            retrieval.location.base,
            'request',
            relPath,
            retrieval,
            new Retrieval(this.options.expectedLocation + '/' + resultFilePath),
            new Storage(this.options.actualLocation + '/' + resultFilePath)
        );

        const obj = yaml.load(retrieval.location.path, contents);
        Object.keys(obj).forEach(key => {
            let request = new Request(suite.path, key, obj[key]);
            suite.add(request);
        });

        return suite;
    }
}