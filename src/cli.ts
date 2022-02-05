#!/usr/bin/env node
import * as fs from 'fs';
import * as path from 'path';
import * as glob from 'glob';
import * as tsNode from 'ts-node';
import { Plier } from './ply';
import { Config, Defaults } from './options';
import { Location } from  './location';
import { Storage } from './storage';
import { Retrieval } from './retrieval';
import { Import } from './import/import';
import { OpenApi } from './plyex/openapi';
import { Plyex } from './plyex/plyex';
import * as yaml from './yaml';
import { ImportOptions } from './import/model';

const start = Date.now();

tsNode.register( { transpileOnly: true } );

const opts = new Config(new Defaults(), true).options;
const { runOptions, ...options } = opts;
const plier = new Plier(options);

if (runOptions?.import) {
    plier.logger.debug('Options', options);
    const importer = new Import(runOptions.import as any, options.testsLocation, plier.logger);
    try {
        const opts: ImportOptions = {
            indent: options.prettyIndent,
            individualRequests: runOptions.individualRequests
        };
        for (const path of options.args) {
            plier.logger.info('Importing', path);
            importer.doImport(new Retrieval(path), opts);
        }
    } catch (err: unknown) {
        plier.logger.error(`${err}`, err);
        process.exit(1);
    }
} else if (runOptions?.openapi) {
    plier.logger.debug('Options', options);
    const plyex = new Plyex(runOptions.openapi, plier.logger);
    for (const path of options.args) {
        const contents = fs.readFileSync(path, { encoding: 'utf8' });
        plier.logger.info('Overwriting', path);
        const isYaml = !contents.startsWith('{');
        const openApi: OpenApi = isYaml ? yaml.load(path, contents) : JSON.parse(contents);
        const augmented = plyex.augment(openApi);
        let updated: string;
        if (isYaml) updated = yaml.dump(augmented, options.prettyIndent);
        else updated = JSON.stringify(augmented, null, options.prettyIndent);
        fs.writeFileSync(path, updated, { encoding: 'utf8' });
    }
}
else {
    let paths: string[] = [];
    let args: string[] = options.args;

    const globOptions = {
        cwd: options.testsLocation,
        ignore: options.ignore
    };
    if (args && args.length > 0) {
        // make arg paths relative to tests loc
        if (options.testsLocation !== '.') {
            args = args.map(arg => {
                const argLoc = new Location(arg);
                if (argLoc.isChildOf(options.testsLocation)) {
                    return argLoc.relativeTo(options.testsLocation);
                } else {
                    plier.logger.error(`WARNING: ${arg} is not under testsLocation ${options.testsLocation}`);
                }
                return arg;
            });
        }

        for (const arg of args) {
            const hash = arg.indexOf('#');
            if (hash > 0) {
                paths.push(arg);
            }
            else {
                // treat as glob pattern
                for (const file of glob.sync(arg, globOptions)) {
                    paths.push(file);
                }
                if (paths.length === 0) {
                    throw new Error(`Test files(s) not found: ${args}`);
                }
            }
        }
    } else {
        paths = [
            ...glob.sync(options.requestFiles, globOptions),
            ...glob.sync(options.caseFiles, globOptions),
            ...glob.sync(options.flowFiles, globOptions)
        ];
    }

    paths = paths.map(p => {
        return path.isAbsolute(p) ? p : options.testsLocation + path.sep + p;
    });

    plier.find(paths).then(plyees => {
        plier.logger.debug('Plyees', plyees);
        plier.run(plyees, runOptions).then(results => {
            const res = { Passed: 0, Failed: 0, Errored: 0, Pending: 0, Submitted: 0 };
            results.forEach(result => res[result.status]++);
            plier.logger.error('\nOverall Results: ' + JSON.stringify(res));
            plier.logger.info(`Overall Time: ${Date.now() - start} ms`);
            if (plier.options.outputFile) {
                new Storage(plier.options.outputFile).write(JSON.stringify(res, null, plier.options.prettyIndent));
            }
            if (res.Failed || res.Errored) {
                process.exit(1);
            }
        }).catch(err => {
            plier.logger.error(err);
            process.exit(1);
        });
    }).catch(err => {
        plier.logger.error(err);
        process.exit(1);
    });
}

