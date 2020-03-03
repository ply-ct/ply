import { Options, PlyOptions, Defaults } from './options';
import { Location } from './location';
import { Retrieval } from './retrieval';
import { Storage } from './storage';
import { Suite } from './suite';
import { Request } from './request';
import { Case } from './case';
const yaml = require('./yaml');

export type TestType = 'request' | 'case' | 'workflow';

export interface Plyable {

    name: string;
    type: TestType
    /**
     * zero-based
     */
    line: number;
}

export class Ply {

    readonly options: PlyOptions;

    constructor(options: Options) {
        this.options = Object.assign({}, new Defaults(), options);
    }

    /**
     * Load request suites.
     * @param locations can be URLs or file paths
     */
    async loadRequests(locations: string[]): Promise<Suite<Request>[]> {
        const retrievals = locations.map(loc => new Retrieval(loc));
        // load request files in parallel
        const promises = retrievals.map(retr => this.loadRequestsSuite(retr));
        return Promise.all(promises);
    }

    async loadRequestsSuite(retrieval: Retrieval): Promise<Suite<Request>> {

        const contents = await retrieval.read();
        if (!contents) {
            throw new Error('Cannot retrieve: ' + retrieval.location.absolute);
        }

        const requests = new Map<string, Request>();

        const relPath = retrieval.location.relativeTo(this.options.testsLocation);
        const resultFilePath = new Location(relPath).parent + '/' + retrieval.location.base + '.' + retrieval.location.ext;

        const suite = new Suite<Request>(
            'request',
            relPath,
            retrieval,
            requests,
            new Retrieval(this.options.expectedLocation + '/' + resultFilePath),
            new Storage(this.options.actualLocation + '/' + resultFilePath)
        )

        const obj = yaml.load(retrieval.location.path, contents);
        Object.keys(obj).forEach(key => {
            let request = new Request(suite.path, key, obj[key]);
            requests.set(key, request);
        });

        return suite;
    }

    async loadCases(locations: string[]): Promise<Suite<Case>[]> {

        const cases = new Map<string, Case>();

        const suite = new Suite<Case>(
            'case',
            '',                 // TODO
            new Retrieval(''),  // TODO
            cases,
            new Retrieval(''),  // TODO
            new Storage('')     // TODO
        )

        // TODO this will use the Typescript compiler API



        return [suite];
    }

}