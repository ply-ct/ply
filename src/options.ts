import * as findUp from 'find-up';
import * as yargs from 'yargs';
import { Retrieval } from './retrieval';
import * as yaml from './yaml';
import { parseJsonc } from './json';

/**
 * Ply options.  Empty values are populated with Defaults.
 */
export interface Options {
    /**
     * Tests base directory ('.').
     */
    testsLocation?: string;
    /**
     * Request files glob pattern, relative to testsLocation ('**\/*.{ply.yaml,ply.yml}').
     */
    requestFiles?: string;
    /**
     * Case files glob pattern, relative to testsLocation ('**\/*.ply.ts').
     */
    caseFiles?: string;
    /**
     * Flow files glob pattern, relative to testsLocation ('**\/*.ply.flow').
     */
    flowFiles?: string;
    /**
     * File pattern to ignore, relative to testsLocation ('**\/{node_modules,bin,dist,out}\/**').
     */
    ignore?: string;
    /**
     * File pattern for requests/cases/flows that shouldn't be directly executed, relative to testsLocation.
     */
    skip?: string;
    /**
     * Expected results base dir (testsLocation + '/results/expected').
     */
    expectedLocation?: string;
    /**
     * Actual results base dir (this.testsLocation + '/results/actual').
     */
    actualLocation?: string;
    /**
     * Result files live under a similar subpath as request/case files (true).
     * (eg: Expected result relative to 'expectedLocation' is the same as
     * request file relative to 'testsLocation').
     */
    resultFollowsRelativePath?: boolean;
    /**
     * Log file base dir (this.actualLocation).
     */
    logLocation?: string;
    /**
     * Files containing values JSON (or CSV or XLSX).
     */
    valuesFiles?: { [file: string]: boolean };
    /**
     * Results summary output JSON
     */
    outputFile?: string;
    /**
     * Verbose output (false). Takes precedence over 'quiet' if both are true.
     */
    verbose?: boolean;
    /**
     * The opposite of 'verbose' (false).
     */
    quiet?: boolean;
    /**
     * Bail on first failure (false).
     */
    bail?: boolean;
    /**
     * Run suites in parallel.
     */
    parallel?: boolean;
    /**
     * (For use with rowwise values). Number of rows to run per batch.
     */
    batchRows?: number;
    /**
     * (For use with rowwise values). Delay in ms between row batches.
     */
    batchDelay?: number;
    /**
     * Reporter output format. Built-in formats: json, csv, xlsx.
     * See https://github.com/ply-ct/ply-viz for more options.
     */
    reporter?: string;
    /**
     * (When flows have loopback links). Max instance count per step (10). Overridable in flow design.
     */
    maxLoops?: number;
    /**
     * Predictable ordering of response body JSON property keys -- needed for verification (true).
     */
    responseBodySortedKeys?: boolean;
    /**
     * Response headers to exclude when generating expected results.
     */
    genExcludeResponseHeaders?: string[];
    /**
     * Media types to be treated as binary.
     */
    binaryMediaTypes?: string[];
    /**
     * Prettification indent for yaml and response body (2).
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
    flowFiles: string;
    ignore: string;
    skip: string;
    expectedLocation: string;
    actualLocation: string;
    resultFollowsRelativePath: boolean;
    logLocation: string;
    valuesFiles: { [file: string]: boolean };
    outputFile?: string;
    verbose: boolean;
    quiet: boolean;
    bail: boolean;
    parallel: boolean;
    batchRows: number;
    batchDelay: number;
    reporter?: string;
    maxLoops: number;
    responseBodySortedKeys: boolean;
    genExcludeResponseHeaders?: string[];
    binaryMediaTypes?: string[];
    prettyIndent: number;
    args?: any;
    runOptions?: RunOptions;
}

/**
 * Options specified on a per-run basis.
 */
export interface RunOptions {
    /**
     * Run test requests but don't verify outcomes.
     */
    submit?: boolean;
    /**
     * Skip verify only if expected result does not exist.
     */
    submitIfExpectedMissing?: boolean;
    /**
     * Create expected from actual and verify based on that.
     */
    createExpected?: boolean;
    /**
     * Create expected from actual only if expected does not exist.
     */
    createExpectedIfMissing?: boolean;

    /**
     * If untrusted, enforce safe expression evaluation without side-effects.
     * Supports a limited subset of template literal expressions.
     * Default is false assuming expressions from untrusted sources are evaluated.
     */
    trusted?: boolean;

    /**
     * Import requests or values from external format (currently 'postman' or 'insomnia' is supported).
     * Overwrites existing same-named files.
     */
    import?: 'postman' | 'insomnia';
    /**
     * Import collections into request suites (.yaml files), instead of individual (.ply) requests.
     */
    importToSuite?: boolean;

    /**
     * Generate report from previously-executed Ply results. See --reporter for options.
     */
    report?: string;

    /**
     * Augment OpenAPI v3 doc at specified path with operation summaries, request/response samples,
     * and code snippets from Ply expected results.
     */
    openapi?: string;

    /**
     * Import case suite modules from generated .js instead of .ts source (default = false).
     * This runOption needs to be set in your case's calls to Suite.run (for requests),
     * and also in originating the call to Suite.run (for the case(s)).
     */
    useDist?: boolean;

    requireTsNode?: boolean;

    /**
     * Runtime override values
     */
    values?: { [key: string]: string };
}

/**
 * Locations are lazily inited to reflect bootstrapped testsLocation.
 */
export class Defaults implements PlyOptions {
    private _expectedLocation?: string;
    private _actualLocation?: string;
    private _logLocation?: string;
    constructor(readonly testsLocation: string = '.') {}
    requestFiles = '**/*.{ply,ply.yaml,ply.yml}';
    caseFiles = '**/*.ply.ts';
    flowFiles = '**/*.ply.flow';
    ignore = '**/{node_modules,bin,dist,out}/**';
    skip = '**/*.ply';
    reporter = '' as any;
    get expectedLocation() {
        if (!this._expectedLocation) {
            this._expectedLocation = this.testsLocation + '/results/expected';
        }
        return this._expectedLocation;
    }
    get actualLocation() {
        if (!this._actualLocation) {
            this._actualLocation = this.testsLocation + '/results/actual';
        }
        return this._actualLocation;
    }
    get logLocation() {
        if (!this._logLocation) {
            this._logLocation = this.actualLocation;
        }
        return this._logLocation;
    }
    resultFollowsRelativePath = true;
    valuesFiles = {};
    verbose = false;
    quiet = false;
    bail = false;
    parallel = false;
    batchRows = 1;
    batchDelay = 0;
    maxLoops = 10;
    responseBodySortedKeys = true;
    genExcludeResponseHeaders = [
        'cache-control',
        'connection',
        'content-length',
        'date',
        'etag',
        'server',
        'transfer-encoding',
        'x-powered-by'
    ];
    binaryMediaTypes = [
        'application/octet-stream',
        'image/png',
        'image/jpeg',
        'image/gif',
        'application/pdf'
    ];
    prettyIndent = 2;
}

export const PLY_CONFIGS = ['plyconfig.yaml', 'plyconfig.yml', 'plyconfig.json'];

export class Config {
    public options: PlyOptions;

    private yargsOptions: any = {
        testsLocation: {
            describe: 'Tests base directory',
            alias: 't'
        },
        requestFiles: {
            describe: 'Request files glob pattern'
        },
        caseFiles: {
            describe: 'Case files glob pattern'
        },
        flowFiles: {
            describe: 'Flow files glob pattern'
        },
        ignore: {
            describe: 'File patterns to ignore'
        },
        skip: {
            describe: 'File patterns to skip'
        },
        submit: {
            describe: "Send requests but don't verify",
            alias: 's',
            type: 'boolean'
        },
        create: {
            describe: 'Create expected result from actual',
            type: 'boolean'
        },
        trusted: {
            describe: 'Expressions are from trusted source',
            type: 'boolean'
        },
        expectedLocation: {
            describe: 'Expected results base dir',
            type: 'string' // avoid premature reading of default
        },
        actualLocation: {
            describe: 'Actual results base dir',
            type: 'string' // avoid premature reading of default
        },
        resultFollowsRelativePath: {
            describe: 'Results under similar subpath'
        },
        logLocation: {
            describe: 'Test logs base dir',
            type: 'string' // avoid premature reading of default
        },
        valuesFiles: {
            describe: 'Values files (comma-separated)',
            type: 'string'
        },
        outputFile: {
            describe: 'Report or summary json file path',
            alias: 'o',
            type: 'string'
        },
        verbose: {
            describe: "Much output (supersedes 'quiet')"
        },
        quiet: {
            describe: "Opposite of 'verbose'"
        },
        bail: {
            describe: 'Stop on first failure'
        },
        parallel: {
            describe: 'Run suites in parallel'
        },
        batchRows: {
            describe: '(Rowwise values) rows per batch'
        },
        batchDelay: {
            describe: '(Rowwise values) ms batch delay'
        },
        reporter: {
            describe: 'Reporter output format'
        },
        maxLoops: {
            describe: 'Flow step instance limit'
        },
        import: {
            describe: 'Import requests/values from external',
            type: 'string'
        },
        importToSuite: {
            describe: 'Import into .yaml suite files',
            type: 'boolean'
        },
        report: {
            describe: 'Generate report from ply results',
            type: 'string'
        },
        openapi: {
            describe: 'Augment OpenAPI 3 docs with examples',
            type: 'string'
        },
        useDist: {
            describe: 'Load cases from compiled js',
            type: 'boolean'
        },
        responseBodySortedKeys: {
            describe: 'Sort response body JSON keys'
        },
        genExcludeResponseHeaders: {
            describe: 'Exclude from generated results',
            type: 'string'
        },
        binaryMediaTypes: {
            describe: 'Binary media types',
            type: 'string'
        },
        prettyIndent: {
            describe: 'Format response JSON'
        }
    };

    constructor(
        private readonly defaults: PlyOptions = new Defaults(),
        commandLine = false,
        configPath?: string
    ) {
        this.options = this.load(defaults, commandLine, configPath);
        this.defaults.testsLocation = this.options.testsLocation;
        // result locations may need priming
        if (!this.options.expectedLocation) {
            this.options.expectedLocation = defaults.expectedLocation;
        }
        if (!this.options.actualLocation) {
            this.options.actualLocation = defaults.actualLocation;
        }
        if (!this.options.logLocation) {
            this.options.logLocation = this.options.actualLocation;
        }
    }

    private load(defaults: PlyOptions, commandLine: boolean, configPath?: string): PlyOptions {
        let opts: any;
        if (commandLine) {
            // help pre-check to avoid premature yargs parsing
            const needsHelp = process.argv.length > 2 && process.argv[2] === '--help';
            if (!configPath && !needsHelp && yargs.argv.config) {
                configPath = '' + yargs.argv.config;
                console.debug(`Loading config from ${configPath}`);
            }
            if (!configPath) {
                configPath = findUp.sync(PLY_CONFIGS, { cwd: defaults.testsLocation });
            }
            const config = configPath ? this.read(configPath) : {};
            if (
                process.argv.length > 2 &&
                process.argv.find((arg) => arg.startsWith('--valuesFiles'))
            ) {
                delete config.valuesFiles; // overridden by command-line option
            }
            let spec = yargs
                .usage('Usage: $0 <tests> [options]')
                .help('help')
                .alias('help', 'h')
                .version()
                .alias('version', 'v')
                .config(config)
                .option('config', {
                    description: 'Ply config location',
                    type: 'string',
                    alias: 'c'
                });
            for (const option of Object.keys(this.yargsOptions)) {
                const yargsOption = this.yargsOptions[option];
                let type = yargsOption.type;
                if (!type) {
                    // infer from default
                    type = typeof (defaults as any)[option];
                }
                spec = spec.option(option, {
                    type,
                    // default: val, // clutters help output
                    ...yargsOption
                });
                if (type === 'boolean') {
                    spec = spec.boolean(option);
                }
            }
            opts = spec.argv;
            if (typeof config.valuesFiles === 'object') {
                // undo yargs messing this up due to dots
                opts.valuesFiles = config.valuesFiles;
            }
            if (typeof opts.valuesFiles === 'string') {
                opts.valuesFiles = opts.valuesFiles
                    .split(',')
                    .reduce((vfs: { [file: string]: boolean }, v: string) => {
                        vfs[v.trim()] = true;
                        return vfs;
                    }, {});
            }
            if (opts.genExcludeResponseHeaders) {
                if (typeof opts.genExcludeResponseHeaders === 'string') {
                    opts.genExcludeResponseHeaders = opts.genExcludeResponseHeaders
                        .split(',')
                        .map((v: string) => v.trim());
                }
                opts.genExcludeResponseHeaders = opts.genExcludeResponseHeaders.map((v: string) =>
                    v.toLowerCase()
                );
            }
            if (opts.binaryMediaTypes) {
                if (typeof opts.binaryMediaTypes === 'string') {
                    opts.binaryMediaTypes = opts.binaryMediaTypes
                        .split(',')
                        .map((v: string) => v.trim());
                }
                opts.binaryMediaTypes = opts.binaryMediaTypes.map((v: string) => v.toLowerCase());
            }
            opts.args = opts._;
            delete opts._;
        } else {
            if (!configPath) {
                configPath = findUp.sync(PLY_CONFIGS, { cwd: defaults.testsLocation });
            }
            opts = configPath ? this.read(configPath) : {};
        }
        let options = { ...defaults, ...opts };

        if (opts.args?.length > 0 && !process.argv.find((arg) => arg.startsWith('--skip'))) {
            // command-line tests passed, and --skip option not supplied, override plyconfig skip
            delete options.skip;
        }

        // clean up garbage keys added by yargs, and private defaults
        options = Object.keys(options).reduce((obj: any, key) => {
            if (key.length > 1 && key.indexOf('_') === -1 && key.indexOf('-') === -1) {
                obj[key] = options[key];
            }
            return obj;
        }, {});

        // run options
        options.runOptions = {};
        if (options.submit) {
            options.runOptions.submit = options.submit;
            delete options.submit;
        }
        if (options.create) {
            options.runOptions.createExpected = options.create;
            delete options.create;
        }
        if (options.trusted) {
            options.runOptions.trusted = options.trusted;
            delete options.trusted;
        }
        if (options.useDist) {
            options.runOptions.useDist = options.useDist;
            delete options.useDist;
        }
        if (options.import) {
            options.runOptions.import = options.import;
            delete options.import;
        }
        if (options.importToSuite) {
            options.runOptions.importToSuite = options.importToSuite;
            delete options.importToSuite;
        }
        if (options.report) {
            options.runOptions.report = options.report;
            delete options.report;
        }
        if (options.openapi) {
            options.runOptions.openapi = options.openapi;
            delete options.openapi;
        }
        if (options.reporter || options.runOptions.report) {
            if (
                !process.argv.includes('-o') &&
                !process.argv.find((av) => av.startsWith('--outputFile='))
            ) {
                delete options.outputFile;
            }
        }

        return options;
    }
    private read(configPath: string): any {
        const retrieval = new Retrieval(configPath);
        const contents = retrieval.sync();
        if (typeof contents === 'string') {
            let config: any;
            if (retrieval.location.isYaml) {
                config = yaml.load(retrieval.location.path, contents);
            } else {
                config = parseJsonc(configPath, contents);
            }
            if (Array.isArray(config.valuesFiles)) {
                // covert all to enabled format
                config.valuesFiles = config.valuesFiles.reduce(
                    (obj: { [file: string]: boolean }, valFile: string) => {
                        if (typeof valFile === 'object') {
                            const file = Object.keys(valFile)[0];
                            obj[file] = valFile[file];
                        } else {
                            obj[valFile] = true;
                        }
                        return obj;
                    },
                    {}
                );
            }
            return config;
        } else {
            throw new Error('Cannot load config: ' + configPath);
        }
    }
}
