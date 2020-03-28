import * as fs from 'fs';
import ts = require('typescript');
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
    async loadRequests(locations: string[]): Promise<Suite<Request>[]> {
        const requestLoader = new RequestLoader(locations, this.options, this.logger);
        return requestLoader.load();
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

    async loadCases(files: string[]): Promise<Suite<Case>[]> {

        const configPath = ts.findConfigFile(this.options.testsLocation, ts.sys.fileExists, "tsconfig.json");
        if (!configPath) {
            throw new Error("Could not find a valid 'tsconfig.json' from " + this.options.testsLocation);
        }

        const configContents = fs.readFileSync(configPath).toString();
        const compilerOptions = ts.parseConfigFileTextToJson(configPath, configContents);

        const caseLoader = new CaseLoader(files, this.options, this.logger, compilerOptions as ts.CompilerOptions);

        const suites = caseLoader.load();
        return suites;
    }

    async loadCaseSuite(file: string): Promise<Suite<Case>> {
        const caseSuites = await this.loadCases([file]);
        if (caseSuites.length === 0) {
            throw new Error(`No case suite found in: ${file}`);
        }
        return caseSuites[0];
    }
}