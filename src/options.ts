import * as findUp from 'find-up';
import * as yargs from 'yargs';
import { Retrieval } from './retrieval';
import * as yaml from './yaml';

/**
 * Ply options.  Empty values are populated with Defaults.
 */
export interface Options {
    /**
     * Tests base directory ('.')
     */
    testsLocation?: string;
    /**
     * Expected results base dir (testsLocation + '/results/expected')
     */
    expectedLocation?: string;
    /**
     * Actual results base dir (this.testsLocation + '/results/actual')
     */
    actualLocation?: string;
    /**
     * Log file base dir (this.actualLocation)
     */
    logLocation?: string;
    /**
     * Request file(s) glob patterns (['**\/*.ply.yaml', ' **\/*.ply.yml'])
     */
    requestFiles?: string[];
    /**
     * Case files(s) glob patterns (['**\/*.ply.ts'])
     */
    caseFiles?: string[];
    /**
     * Exclude file patterns (['**\/{ node_modules, bin, dist, out }\/**'])
     */
    excludes?: string[];
    /**
     * Verbose output (false)
     */
    verbose?: boolean;
    /**
     * Bail on first failure (false)
     */
    bail?: boolean;
    /**
     * Prettify response body and sort JSON properties by name -- needed for verification (true)
     */
    formatResponseBody?: boolean;
    /**
     * Prettification indent for yaml and response body (2)
     */
    prettyIndent?: number;
    /**
     * Response headers to be considered in verifying results, ordered as they should appear in results (['content-type']).
     * If not specified, all headers are included in output yaml in alphabetical order.
     */
    responseHeaders?: string[];
}

/**
 * Populated ply options.
 */
export interface PlyOptions extends Options {
    testsLocation: string;
    expectedLocation: string;
    actualLocation: string;
    logLocation?: string;
    requestFiles: string[];
    caseFiles: string[];
    excludes: string[];
    verbose: boolean;
    bail: boolean;
    formatResponseBody: boolean;
    prettyIndent: number;
    responseHeaders?: string[];
}

export class Defaults implements PlyOptions {
    constructor(readonly testsLocation: string = '.') {}
    expectedLocation = this.testsLocation + '/results/expected';
    actualLocation = this.testsLocation + '/results/actual';
    logLocation = this.actualLocation;
    requestFiles = ['**/*.ply.yaml', '**/*.ply.yml'];
    caseFiles = ['**/*.ply.ts'];
    excludes = ['**/{node_modules,bin,dist,out}/**'];
    verbose = false;
    bail = false;
    formatResponseBody = true;
    prettyIndent = 2;
    responseHeaders = ['content-type'];
}

export class Config {

    public options: PlyOptions;

    constructor(private readonly defaults: PlyOptions = new Defaults()) {
        const logEqualsActual = defaults.actualLocation === defaults.logLocation;
        this.options = this.load(defaults);
        if (logEqualsActual) {
            // in case yargs adjusted actualLocation per cwd
            this.options.logLocation = this.options.actualLocation;
        }
    }

    private load(defaults: PlyOptions) : PlyOptions {
        const configPath = findUp.sync(['.plyrc.yaml', '.plyrc.yml', '.plyrc.json'], { cwd: defaults.testsLocation });
        const config = configPath ? this.read(configPath) : {};
        const options = yargs.config(config).argv;
        return Object.assign({}, defaults, options);
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