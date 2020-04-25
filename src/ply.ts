import * as fs from 'fs';
import * as ts from 'typescript';
import { Options, Config, PlyOptions, Defaults } from './options';
import { Suite } from './suite';
import { Request } from './request';
import { Case } from './case';
import { CaseLoader } from './cases';
import { RequestLoader } from './requests';
import { Logger, LogLevel } from './logger';

/**
 * Create with options from config file.
 */
export function create(): Ply {
    const options = new Config().options;
    return new Ply(options);
}

// TODO: direct run?
// await ply.run('test/ply/requests/movies-api.ply.yaml#createMovie', values);
export class Ply {

    readonly options: PlyOptions;
    readonly logger: Logger;

    constructor(options: Options) {
        this.options = Object.assign({}, new Defaults(), options);
        this.logger = new Logger({
            level: options.verbose ? LogLevel.debug : LogLevel.info,
            location: options.logLocation,
            prettyIndent: this.options.prettyIndent
        });
    }

    /**
     * Load request suites.
     * @param locations can be URLs or file paths
     */
    async loadRequests(location: string): Promise<Suite<Request>[]>;
    async loadRequests(...locations: string[]): Promise<Suite<Request>[]>;
    async loadRequests(locations: string[], ...moreLocations: string[]): Promise<Suite<Request>[]>;
    async loadRequests(locations: string | string[], ...moreLocations: string[]): Promise<Suite<Request>[]> {
        if (typeof locations === 'string') {
            locations = [locations];
        }
        if (moreLocations) {
            locations = locations.concat(moreLocations);
        }
        const requestLoader = new RequestLoader(locations, this.options, this.logger);
        return await requestLoader.load();
    }

    /**
     * Throws if location or suite not found
     */
    async loadRequestSuite(location: string): Promise<Suite<Request>> {
        const requestSuites = await this.loadRequests([location]);
        if (requestSuites.length === 0) {
            throw new Error(`No request suite found in: ${location}`);
        }
        return requestSuites[0];
    }

    async loadSuite(location: string): Promise<Suite<Request>> {
        return await this.loadRequestSuite(location);
    }

    async loadCases(file: string): Promise<Suite<Case>[]>;
    async loadCases(...files: string[]): Promise<Suite<Case>[]>;
    async loadCases(files: string[], ...moreFiles: string[]): Promise<Suite<Case>[]>;
    async loadCases(files: string | string[], ...moreFiles: string[]): Promise<Suite<Case>[]> {
        if (typeof files === 'string') {
            files = [files];
        }
        if (moreFiles) {
            files = files.concat(moreFiles);
        }
        const configPath = ts.findConfigFile(this.options.testsLocation, ts.sys.fileExists, "tsconfig.json");
        if (!configPath) {
            throw new Error("Could not find a valid 'tsconfig.json' from " + this.options.testsLocation);
        }

        const configContents = fs.readFileSync(configPath).toString();
        const compilerOptions = ts.parseConfigFileTextToJson(configPath, configContents);

        const caseLoader = new CaseLoader(files, this.options, this.logger, compilerOptions as ts.CompilerOptions);

        const suites = await caseLoader.load();
        return suites;
    }
}