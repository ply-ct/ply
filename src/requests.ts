import * as osLocale from 'os-locale';
import { PlyOptions } from './options';
import { Suite } from './suite';
import { Retrieval } from './retrieval';
import { Request, PlyRequest } from './request';
import { ResultPaths, Runtime } from './runtime';
import { Logger, LogLevel } from './logger';
import { PlyIgnore } from './ignore';
import * as yaml from './yaml';
import { lines } from './util';

export class RequestLoader {

    private ignore: PlyIgnore;

    constructor(
        readonly locations: string[],
        private options: PlyOptions
    ) {
        this.ignore = new PlyIgnore(options.testsLocation);
    }

    async load(): Promise<Suite<Request>[]> {
        const retrievals = this.locations.map(loc => new Retrieval(loc));
        // load request files in parallel
        const promises = retrievals.map(retr => this.loadSuite(retr));
        const suites = await Promise.all(promises);
        suites.sort((s1, s2) => s1.name.localeCompare(s2.name));
        return suites;
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
        const results = await ResultPaths.create(this.options, suiteName, retrieval);

        const runtime = new Runtime(
            await osLocale(),
            this.options,
            retrieval,
            results
        );

        const logger = new Logger({
            level: this.options.verbose ? LogLevel.debug : LogLevel.info,
            prettyIndent: this.options.prettyIndent
        }, runtime.results.log);

        const suite = new Suite<Request>(
            retrieval.location.base,
            'request',
            retrieval.location.relativeTo(this.options.testsLocation),
            runtime,
            logger,
            0,
            lines(contents).length - 1
        );

        const obj = yaml.load(retrieval.location.path, contents, true);
        for (const key of Object.keys(obj)) {
            const val = obj[key];
            if (typeof val === 'object') {
                const startEnd = { start: val.__start, end: val.__end };
                const { __start, __end, ...cleanObj} = val;
                const request = new PlyRequest(key, { ...startEnd, ...cleanObj } as Request, logger, retrieval);
                suite.add(request);
            }
        }

        // mark if ignored
        if (this.ignore.isExcluded(suite.path)) {
            suite.ignored = true;
        }

        return suite;
    }

}