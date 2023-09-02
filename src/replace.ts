import { Context, resolve } from '@ply-ct/ply-values';
import { Log } from './log';
import * as util from './util';
import { RESULTS } from './names';

export interface ReplaceOptions {
    logger?: Log;
    trusted?: boolean;
}

/**
 * Replaces template expressions with values from context (per line), with template literal
 * syntax. Untrusted supports a limited subset of template literal. Ignores regular expressions
 * starting with ${~. * Resulting newlines are always \n.
 */
export const replace = (template: string, context: Context, options?: ReplaceOptions): string => {
    return util
        .lines(template)
        .map((l) => replaceLine(l, context, options))
        .join('\n');
};

export const replaceLine = (line: string, context: Context, options?: ReplaceOptions): string => {
    try {
        let l = line.replace(/\${@\[/g, '${' + RESULTS + '[');
        l = l.replace(/\${@/g, '${' + RESULTS + '.');
        return l.replace(/\$\{.+?}/g, (expr) => {
            return resolve(expr, context, options?.trusted, options?.logger);
        });
    } catch (err: any) {
        if (err.message === `${RESULTS} is not defined`) {
            err.message = 'No previous results found';
        }
        options?.logger?.error(`Error in expression:\n${line}\n** ${err.message} **`);
        options?.logger?.debug(`${err}`, err);
        return line;
    }
};
