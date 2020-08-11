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
     * Request files glob pattern, relative to testsLocation ('**\/*.{ply.yaml,ply.yml}')
     */
    requestFiles?: string;
    /**
     * Case files glob pattern, relative to testsLocation ('**\/*.ply.ts')
     */
    caseFiles?: string;
    /**
     * File pattern to ignore, relative to testsLocation ('**\/{node_modules,bin,dist,out}\/**')
     */
    ignore?: string;
    /**
     * File pattern for requests/cases/workflows that shouldn't be directly executed, relative to testsLocation
     */
    skip?: string;
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
    ignore: string;
    skip: string;
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
    ignore = '**/{node_modules,bin,dist,out}/**';
    skip = '';
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

    private yargsOptions: any = {
        testsLocation: {
            describe: 'Tests base directory',
            alias: 't'
        },
        requestFiles: {
            describe: 'Request files glob pattern',
            alias: 'r'
        },
        caseFiles: {
            describe: 'Case files glob pattern',
            alias: 'c'
        },
        ignore: {
            describe: 'File patterns to ignore'
        },
        skip: {
            describe: 'File patterns to skip'
        },
        expectedLocation: {
            describe: 'Expected results base dir'
        },
        actualLocation: {
            describe: 'Actual results base dir'
        },
        resultFollowsTestRelativePath: {
            describe: 'Results under similar subpath'
        },
        logLocation: {
            describe: 'Test logs base dir'
        },
        verbose: {
            describe: 'Verbose logging output'
        },
        bail: {
            describe: 'Stop on first failure'
        },
        responseBodySortedKeys: {
            describe: 'Sort response body JSON keys'
        },
        prettyIndent: {
            describe: 'Formats response JSON'
        }
    };

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
            ['plyconfig.yaml', 'plyconfig.yml', 'plyconfig.json'], { cwd: defaults.testsLocation });
        const config = configPath ? this.read(configPath) : {};
        let options;
        if (commandLine) {
            let spec = yargs
                .config(config)
                .usage('Usage: $0 <tests> [options]')
                .help('help').alias('help', 'h')
                .alias('version', 'v');
            for (const option of Object.keys(defaults)) {
                const val = (defaults as any)[option];
                const type = typeof val;
                const yargsOption = this.yargsOptions[option];
                if (yargsOption) {
                    spec = spec.option(option, {
                        type,
                        // default: val, // clutters help output
                        ...yargsOption
                    });
                }
                if (type === 'boolean') {
                    spec = spec.boolean(option);
                }
            }
            options = spec.argv;
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