import { Retrieval } from './retrieval';
import { Storage } from './storage';
import { Suite } from './suite';
import { Request } from './request';
const yaml = require('./yaml');
const postman = require('./postman');

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


    async loadRequests(retrieval: Retrieval): Promise<Suite<Request>> {

        let storage = new Storage('temp', 'greeting.txt')

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


        if (contents.startsWith('{')) {
            const obj = JSON.parse(contents);
            if (postman.isCollection(obj)) {
                // TODO postman requests
                // return this.loadCollection(location).getRequests();
            }
        } else {
            const obj = yaml.load(retrieval.path, contents);
            Object.keys(obj).forEach(key => {
                let request = new Request(suite, key, obj[key]);
                requests.set(key, request);
            });
        }

        return suite;

    }
}