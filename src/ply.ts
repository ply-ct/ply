import * as fs from 'fs';
import * as ts from 'typescript';
import { EventEmitter } from 'events';
import { Options, Config, PlyOptions, Defaults } from './options';
import { Suite } from './suite';
import { Request } from './request';
import { Case } from './case';
import { CaseLoader } from './cases';
import { RequestLoader } from './requests';
import { Result } from './result';

export class Ply {

    readonly options: PlyOptions;

    constructor(options?: Options) {
        this.options = Object.assign({}, new Defaults(), options || new Config().options);
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
        const requestLoader = new RequestLoader(locations, this.options);
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

        const caseLoader = new CaseLoader(files, this.options, compilerOptions as ts.CompilerOptions);

        const suites = await caseLoader.load();
        return suites;
    }
}

/**
 * Format: <suite_file>#<test_name>
 * eg: c:\ply\ply\test\ply\requests\movie-queries.ply.yaml#moviesByYearAndRating
 * or: /Users/donaldoakes/ply/ply/test/ply/cases/movieCrud.ply.ts#movie-crud^add new movie
 * (TODO: handle caseFile#suite^case)
 */
export class Plyee {
    private hash: number;
    private hat: number;;

    constructor(readonly path: string) {
        this.hash = path.indexOf('#');
        if (this.hash < 1 || this.hash > path.length - 2) {
            throw new Error('Invalid path: ${path}');
        }
        this.hat = path.lastIndexOf('^');
        if (this.hat < this.hash || this.hat < this.path.length - 1) {
            this.hat = -1;
        }
    }

    get location(): string {
        return this.path.substring(0, this.hash);
    }

    get suite(): string {
        if (this.hat > 0) {
            return this.path.substring(this.hash + 1, this.hat);
        }
        else {
            return this.location;
        }
    }

    get test(): string {
        if (this.hat > 0) {
            return this.path.substring(this.hat + 1);
        }
        else {
            return this.path.substring(this.hash + 1);
        }
    }

    static requests(paths: string[]): Map<string, Plyee[]> {
        return this.collect(paths, plyee => {
            return plyee.location.endsWith('.yml') || plyee.location.endsWith('.yaml');
        });
    }

    static cases(paths: string[]): Map<string, Plyee[]> {
        return this.collect(paths, plyee => plyee.location.endsWith('.ts'));
    }
    /**
     * Returns a map of unique location to Plyee[]
     */
    static collect(paths: string[], test?: (plyee: Plyee) => boolean): Map<string, Plyee[]> {
        const map = new Map<string, Plyee[]>();
        for (const path of paths) {
            let plyee = new Plyee(path);
            if (!test || test(plyee)) {
                let plyees = map.get(plyee.location);
                if (!plyees) {
                    plyees = [];
                    map.set(plyee.location, plyees);
                }
                plyees.push(plyee);
            }
        }
        return map;
    }
}

export class Plyer extends EventEmitter {
    private ply: Ply;
    constructor(options?: Options) {
        super({ captureRejections: true });
        this.ply = new Ply(options);
    }

    async run(plyees: string[], values: object): Promise<Result[]> {
        const promises: Promise<Result[]>[] = [];
        for (const [loc, requestPlyee] of Plyee.requests(plyees)) {
            const tests = requestPlyee.map(plyee => plyee.test);
            this.ply.loadRequestSuite(loc)
            .then(requestSuite => {
                promises.push(requestSuite.run(tests, values));
            });
        }
        // TODO cases

        let allResults: Result[] = [];
        for (const results of await Promise.all(promises)) {
            allResults = allResults.concat(results);
        }
        return allResults;
    }

    on(event: string | symbol, listener: (...args: any[]) => void): this {
        return super.on(event, listener);
    }
}
