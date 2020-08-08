#!/usr/bin/env node

import * as glob from 'glob';
import { Ply } from './ply';
import { Config, Defaults } from './options';
import { Logger, LogLevel } from './logger';


const options = new Config(new Defaults(), true).options;
const ply = new Ply(options);
const logger = new Logger({ level: options.verbose ? LogLevel.debug : LogLevel.info });
const args: string[] = options.args;

const requests: string[] = [];
const cases: string[] = [];

if (args) {
    for (const arg of args) {
        for (const file of glob.sync(arg)) {
            if (file.endsWith('.ts')) {
                cases.push(file);
            } else {
                requests.push(file);
            }
        }
    }
} else {
    console.log("ELSE");
}

console.log("ARGS: " + JSON.stringify(args[0]));