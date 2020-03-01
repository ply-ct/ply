import * as findUp from 'find-up';
import * as yargs from 'yargs';
import { Retrieval } from './retrieval';
import * as yaml from './yaml';

export interface Options {
    /**
     * tests base directory ('.')
     */
    testsLocation?: string;
    /**
     * expected results base dir (testsLocation + '/results/expected')
     */
    expectedLocation?: string;
    /**
     * actual results base dir (this.testsLocation + '/results/actual')
     */
    actualLocation?: string;
    /**
     * log file base dir (this.actualLocation)
     */
    logLocation?: string;
    /**
     * request file(s) glob patterns (['**\/*.ply.yaml', ' **\/*.ply.yml'])
     */
    requestFiles?: string[];
    /**
     * case files(s) glob patterns (['**\/*.ply.ts'])
     */
    caseFiles?: string[];
    /**
     * verbose output (false)
     */
    verbose?: boolean;
    /**
     * bail on first failure (false)
     */
    bail?: boolean;
    /**
     * prettify response body -- needed for comparison (true)
     */
    formatResponseBody?: boolean;
    /**
     * prettification indent (2)
     */
    responseBodyIndent?: number;
    /**
     * retain log (false)
     */
    retainLog?: boolean;
    /**
     * capture result (true)
     */
    captureResult?: boolean;
    /**
     * retain result (false)
     */
    retainResult?: boolean;
    /**
     * response headers (['content-type'])
     */
    responseHeaders?: string[];
}

export class DefaultOptions implements Options {
    testsLocation = '.';
    expectedLocation = this.testsLocation + '/results/expected';
    actualLocation = this.testsLocation + '/results/actual';
    logLocation = this.actualLocation;
    requestFiles = ['**/*.ply.yaml', '**/*.ply.yml'];
    caseFiles = ['**/*.ply.ts'];
    verbose = false;
    bail = false;
    formatResponseBody = true;
    responseBodyIndent = 2;
    retainLog = false;
    captureResult = true;
    retainResult = false;
    responseHeaders = ['content-type'];
}

export class Config {

    public options: Options;

    constructor() {
        this.options = this.load();
    }

    private load() : Options {
        const configPath = findUp.sync(['.plyrc.yaml', '.plyrc.yml', '.plyrc.json']);
        const config = configPath ? this.read(configPath) : {};
        const options = yargs.config(config).argv;
        return Object.assign({testsLocation: '.'}, options);
    }

    private read(configPath: string): object {
        const retrieval = new Retrieval(configPath);
        const contents = retrieval.sync();
        if (typeof contents === 'string') {
            if (retrieval.location.isYaml) {
                return yaml.load(retrieval.location.path, contents);
            }
            else {
                return JSON.parse(contents);
            }
        }
        else {
            throw new Error("Cannot load config: " + configPath);
        }
    }
}