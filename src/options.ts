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
     * Request file(s) glob patterns ('**\/*.{ply.yaml,ply.yml}') -- relative to testsLocation
     */
    requestFiles?: string;
    /**
     * Case files(s) glob pattern ('**\/*.ply.ts') -- relative to testsLocation
     */
    caseFiles?: string;
    /**
     * Exclude file pattern (['**\/{node_modules,bin,dist,out}\/**'])
     */
    excludes?: string;
    /**
     * Expected results base dir (testsLocation + '/results/expected')
     */
    expectedLocation?: string;
    /**
     * Actual results base dir (this.testsLocation + '/results/actual')
     */
    actualLocation?: string;
    /**
     * Result files live under a similar subpath as request/case files (true).
     * (eg: Expected result relative to 'expectedLocation' is the same as
     * request file relative to 'testsLocation').
     */
    resultFollowsTestRelativePath?: boolean;
    /**
     * Log file base dir (this.actualLocation)
     */
    logLocation?: string;
    /**
     * Verbose output (false)
     */
    verbose?: boolean;
    /**
     * Bail on first failure (false)
     */
    bail?: boolean;
    /**
     * Predictable ordering of response body JSON property keys -- needed for verification (true)
     */
    responseBodySortedKeys?: boolean;
    /**
     * Prettification indent for yaml and response body (2)
     */
    prettyIndent?: number;
}

/**
 * Populated ply options.
 */
export interface PlyOptions extends Options {
    testsLocation: string;
    requestFiles: string;
    caseFiles: string;
    excludes: string;
    expectedLocation: string;
    actualLocation: string;
    resultFollowsTestRelativePath: boolean;
    logLocation?: string;
    verbose: boolean;
    bail: boolean;
    responseBodySortedKeys: boolean;
    prettyIndent: number;
    args?: any;
}

export class Defaults implements PlyOptions {
    constructor(readonly testsLocation: string = '.') {}
    requestFiles = '**/*.{ply.yaml,ply.yml}';
    caseFiles = '**/*.ply.ts';
    excludes = '**/{node_modules,bin,dist,out}/**';
    expectedLocation = this.testsLocation + '/results/expected';
    actualLocation = this.testsLocation + '/results/actual';
    resultFollowsTestRelativePath = true;
    logLocation = this.actualLocation;
    verbose = false;
    bail = false;
    responseBodySortedKeys = true;
    prettyIndent = 2;
}

export class Config {

    public options: PlyOptions;

    constructor(private readonly defaults: PlyOptions = new Defaults(), private readonly commandLine = false) {
        const logEqualsActual = defaults.actualLocation === defaults.logLocation;
        this.options = this.load(defaults, commandLine);
        if (logEqualsActual) {
            // in case yargs adjusted actualLocation per cwd
            this.options.logLocation = this.options.actualLocation;
        }
    }

    private load(defaults: PlyOptions, commandLine: boolean) : PlyOptions {
        const configPath = findUp.sync(
            ['.plyrc.yaml', '.plyrc.yml', '.plyrc.json'], { cwd: defaults.testsLocation });
        const config = configPath ? this.read(configPath) : {};
        let options;
        if (commandLine) {
            options = yargs
                .config(config)
                .usage('Usage: $0 <tests> [options]')
                .help('help').alias('help', 'h')
                .argv;
            options.args = options._;
            delete options._;
        } else {
            options =  { ...config };
        }
        return { ...defaults, ...options};
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