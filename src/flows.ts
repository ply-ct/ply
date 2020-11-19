import * as flowbee from 'flowbee';
import { Flow, PlyFlow } from './flow';
import { Logger, LogLevel } from './logger';
import { PlyOptions } from './options';
import { Retrieval } from './retrieval';
import { ResultPaths, Runtime } from './runtime';
import { Suite } from './suite';
import { Request } from './request';
import * as util from './util';
import * as yaml from './yaml';
import { Skip } from './skip';

export class FlowLoader {

    private skip: Skip | undefined;

    constructor(
        readonly locations: string[],
        private options: PlyOptions
    ) {
        if (options.skip) {
            this.skip = new Skip(options.testsLocation, options.skip);
        }
    }

    async load(): Promise<Suite<Flow>[]> {
        const retrievals = this.locations.map(loc => new Retrieval(loc));
        // load request files in parallel
        const promises = retrievals.map(retr => this.loadSuite(retr));
        const suites = await Promise.all(promises);
        suites.sort((s1, s2) => s1.name.localeCompare(s2.name));
        return suites;
    }

    async loadSuite(retrieval: Retrieval): Promise<Suite<Flow>> {
        const contents = await retrieval.read();
        if (typeof contents === 'undefined') {
            throw new Error('Cannot retrieve: ' + retrieval.location.absolute);
        }
        const resultPaths = await ResultPaths.create(this.options, retrieval);
        return this.buildSuite(retrieval, contents, resultPaths);
    }

    buildSuite(retrieval: Retrieval, contents: string, resultPaths: ResultPaths): Suite<Flow> {
        const runtime = new Runtime(
            this.options,
            retrieval,
            resultPaths
        );

        const logger = new Logger({
            level: this.options.verbose ? LogLevel.debug : (this.options.quiet ? LogLevel.error : LogLevel.info),
            prettyIndent: this.options.prettyIndent
        }, runtime.results.log);

        const suite = new Suite<Flow>(
            retrieval.location.base,
            'flow',
            retrieval.location.relativeTo(this.options.testsLocation),
            runtime,
            logger,
            0,
            util.lines(contents).length - 1
        );

        // request suite comprising all requests configured in steps
        const requestSuite = new Suite<Request>(
            retrieval.location.base,
            'request',
            retrieval.location.relativeTo(runtime.options.testsLocation),
            runtime,
            logger,
            0, 0
        );

        const flowbeeFlow = FlowLoader.parse(contents, retrieval.location.path);
        requestSuite.callingFlowInfo = {
            results: resultPaths,
            suiteName: retrieval.location.base,
            flowName: flowbeeFlow.path
        };

        suite.add(new PlyFlow(flowbeeFlow, requestSuite, logger));

        // mark if skipped
        if (this.skip?.isSkipped(suite.path)) {
            suite.skip = true;
        }

        return suite;
    }

    /**
     * Parse a flowbee flow from text (reproduced from flowbee.FlowDiagram)
     * @param text json or yaml
     * @param file file name
     */
    static parse(text: string, file: string): flowbee.Flow {
        let flow: flowbee.Flow;
        if (text.startsWith('{')) {
            try {
                flow = JSON.parse(text);
            } catch (err) {
                throw new Error(`Failed to parse ${file}: ${err.message}`);
            }
        } else {
            flow = yaml.load(file, text, false);
        }
        flow.type = 'flow';
        flow.path = file.replace(/\\/g, '/');
        return flow;
    }
}