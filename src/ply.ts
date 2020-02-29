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

    /**
     * Load request suites.
     * @param locations can be URLs or file paths
     */
    async loadRequests(locations: string[]) {
        const retrievals = locations.map(loc => new Retrieval(loc, ''));

    }

    async loadRequestSuite(retrieval: Retrieval): Promise<Suite<Request>> {

        const name = retrieval.name;
        const requests = new Map<string,Request>();

        const contents = await retrieval.read();
        if (!contents) {
            throw new Error('Cannot retrieve: ' + retrieval);
        }

        const suite = new Suite<Request>(
            'request',
            name,
            retrieval,
            requests,
            new Retrieval('', ''),  // TODO
            new Storage('', '')     // TODO
        )

        const obj = yaml.load(retrieval.path, contents);
        Object.keys(obj).forEach(key => {
            let request = new Request(suite, key, obj[key]);
            requests.set(key, request);
        });

        return suite;

    }

    async loadCaseSuite(): Promise<Suite<Case>> {

        const name = 'suite name'; //retrieval.name;
        const cases = new Map<string, Case>();

        const suite = new Suite<Case>(
            'case',
            name,
            new Retrieval('', ''),  // TODO
            cases,
            new Retrieval('', ''),  // TODO
            new Storage('', '')     // TODO
        )

        // TODO this will use the Typescript compiler API



        return suite;
    }

}