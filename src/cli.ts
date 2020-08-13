#!/usr/bin/env node

import * as process from 'process';
import * as path from 'path';
import * as glob from 'glob';
import { Plier } from './ply';
import { Config, Defaults } from './options';
import { Logger, LogLevel } from './logger';
import { Values } from './values';
import { Location } from  './location';
import * as tsNode from 'ts-node';

tsNode.register( { transpileOnly: true } );

const options = new Config(new Defaults(), true).options;
const logger = new Logger({
    level: options.verbose ? LogLevel.debug : LogLevel.info,
    prettyIndent: options.prettyIndent
});

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
                logger.error(`WARNING: ${arg} is not under testsLocation ${options.testsLocation}`);
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
        }
    }
} else {
    paths = glob.sync(options.requestFiles, globOptions);
    paths = paths.concat(glob.sync(options.caseFiles, globOptions));
}

paths = paths.map(p => {
    return path.isAbsolute(p) ? p : options.testsLocation + path.sep + p;
});

const plier = new Plier(options);
plier.find(paths).then(plyees => {
    logger.debug('Plyees', plyees);
    // TODO values (does not work for ply-demo)
    new Values(['./test/values/localhost.json']).read().then(values => {
        // TODO run options
        const runOptions = undefined;
        plier.run(plyees, values, runOptions).then(results => {
            const res = { Passed: 0, Failed: 0, Errored: 0, Pending: 0, 'Not Verified': 0 };
            results.forEach(result => res[result.status]++);
            logger.info('\nOverall Results: ' + JSON.stringify(res));
            if (res.Failed || res.Errored) {
                process.exit(1);
            }
        }).catch(err => {
            logger.error(err);
        });
    }).catch(err => {
        logger.error(err);
    });
}).catch(err => {
    logger.error(err);
});


