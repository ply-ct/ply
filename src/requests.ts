import * as osLocale from 'os-locale';
import { PlyOptions } from './options';
import { Suite } from './suite';
import { Retrieval } from './retrieval';
import { Request, PlyRequest } from './request';
import { ResultPaths, Runtime } from './runtime';
import { Logger } from './logger';
import * as yaml from './yaml';
import { Z_DEFAULT_STRATEGY } from 'zlib';

export class RequestLoader {

    constructor(readonly locations: string[], private options: PlyOptions, private logger: Logger) {
    }

    async load(): Promise<Suite<Request>[]> {
        const retrievals = this.locations.map(loc => new Retrieval(loc));
        // load request files in parallel
        const promises = retrievals.map(retr => this.loadSuite(retr));
        return await Promise.all(promises);
    }

    async loadSuite(retrieval: Retrieval): Promise<Suite<Request>> {

        const contents = await retrieval.read();
        if (!contents) {
            throw new Error('Cannot retrieve: ' + retrieval.location.absolute);
        }

        let suiteName = retrieval.location.base;
        if (suiteName.endsWith('.ply')) {
            suiteName = suiteName.substring(0, suiteName.length - 4);
        }
        let results = await ResultPaths.create(this.options, suiteName, retrieval);

        const runtime = new Runtime(
            await osLocale(),
            this.options,
            this.logger,
            retrieval,
            results
        );

        const suite = new Suite<Request>(
            retrieval.location.base,
            'request',
            retrieval.location.relativeTo(this.options.testsLocation),
            runtime,
            0,
            contents.split(/\r?\n/).length - 1
        );

        const obj = yaml.load(retrieval.location.path, contents, true);
        for (const key of Object.keys(obj)) {
            let val = obj[key];
            if (typeof val === 'object') {
                let startEnd = { start: val.__start, end: val.__end };
                let { __start, __end, ...cleanObj} = val;
                let request = new PlyRequest(key, { ...startEnd, ...cleanObj } as Request);
                suite.add(request);
            }
        }
        return suite;
    }
}
