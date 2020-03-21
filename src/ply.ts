import * as fs from 'fs';
import ts = require('typescript');
import { Options, Config, PlyOptions, Defaults } from './options';
import { Suite } from './suite';
import { Request } from './request';
import { Case } from './case';
import { CaseLoader } from './cases';
import { RequestLoader } from './requests';

/**
 * Create with options from config file.
 */
export function create(): Ply {
    const options = new Config().options;
    return new Ply(options);
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
        const requestLoader = new RequestLoader(locations, this.options);
        return requestLoader.load();
    }

    async loadCases(files: string[]): Promise<Suite<Case>[]> {

        const configPath = ts.findConfigFile(this.options.testsLocation, ts.sys.fileExists, "tsconfig.json");
        if (!configPath) {
            throw new Error("Could not find a valid 'tsconfig.json' from " + this.options.testsLocation);
        }

        const configContents = fs.readFileSync(configPath).toString();
        const compilerOptions = ts.parseConfigFileTextToJson(configPath, configContents);

        const caseLoader = new CaseLoader(files, this.options, compilerOptions as ts.CompilerOptions);

        const suites = caseLoader.load();
        return suites;
    }
}