import * as fs from 'fs';
import { Options, PlyOptions, Defaults } from './options';
import { Location } from './location';
import { Retrieval } from './retrieval';
import { Storage } from './storage';
import { Suite } from './suite';
import { Request } from './request';
import { Case } from './case';
import { CaseLoader } from './caseLoader';
import ts = require('typescript');
const yaml = require('./yaml');

export type TestType = 'request' | 'case' | 'workflow';

export interface Plyable {

    name: string;
    type: TestType
    /**
     * zero-based
     */
    line: number;

    /**
     * run the test
     */
    ply(): Promise<void>;
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

    async loadCases(locations: string[]): Promise<Suite<Case>[]> {

        const configPath = ts.findConfigFile("./", ts.sys.fileExists,"tsconfig.json");
        if (!configPath) {
            throw new Error("Could not find a valid 'tsconfig.json'.");
        }

        const configContents = fs.readFileSync(configPath).toString();
        const compilerOptions = ts.parseConfigFileTextToJson(configPath, configContents);

        const caseLoader = new CaseLoader(locations, compilerOptions as ts.CompilerOptions);

        const cases = caseLoader.load();




        const retrievals = locations.map(loc => new Retrieval(loc));


        // load case files in parallel
        const promises = retrievals.map(retr => this.loadCaseSuite(retr));
        return Promise.all(promises);
    }

    async loadCaseSuite(retrieval: Retrieval): Promise<Suite<Case>> {

        const contents = await retrieval.read();
        if (!contents) {
            throw new Error('Cannot retrieve: ' + retrieval.location.absolute);
        }

        const relPath = retrieval.location.relativeTo(this.options.testsLocation);
        const resultFilePath = new Location(relPath).parent + '/' + retrieval.location.base + '.' + retrieval.location.ext;

        const suite = new Suite<Case>(
            'case',
            relPath,
            retrieval,
            new Retrieval(this.options.expectedLocation + '/' + resultFilePath),
            new Storage(this.options.actualLocation + '/' + resultFilePath)
        )

        return suite;
    }
}