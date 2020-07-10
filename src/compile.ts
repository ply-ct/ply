import * as fs from 'fs';
import * as ts from 'typescript';
import { PlyOptions } from './options';
import { Location } from './location';

export class TsCompileOptions {

    compilerOptions: ts.CompilerOptions;
    outDir: string;
    outFile?: string;

    constructor(options: PlyOptions) {
        const configPath = ts.findConfigFile(options.testsLocation, ts.sys.fileExists, "tsconfig.json");
        if (!configPath) {
            throw new Error("Could not find a valid 'tsconfig.json' from " + options.testsLocation);
        }

        const configContents = fs.readFileSync(configPath).toString();
        this.compilerOptions = ts.parseConfigFileTextToJson(configPath, configContents) as ts.CompilerOptions;
        const config = this.compilerOptions.config as any;
        let outDir;
        let outFile;
        if (config) {
            outDir = config.compilerOptions?.outDir;
            outFile = config.compilerOptions?.outFile;
        }
        if (!outDir) {
            if (!outFile) {
                throw new Error('Neither outDir nor outFile found in typescript compiler options');
            }
            outDir = new Location(outFile).parent;
        }
        this.outFile = outFile;
        this.outDir = outDir;
    }
}