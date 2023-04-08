import { Log } from './log';
import * as util from './util';
import { RESULTS } from './names';
import { resolve } from 'flowbee';

export interface ReplaceOptions {
    logger?: Log;
    trusted?: boolean;
}

/**
 * Replaces template expressions with values from context (per line), with template literal
 * syntax. Untrusted supports a limited subset of template literal. Ignores regular expressions
 * starting with ${~. * Resulting newlines are always \n.
 */
export const replace = (template: string, context: object, options?: ReplaceOptions): string => {
    const lines: string[] = [];
    for (const line of util.lines(template)) {
        try {
            let l = line.replace(/\${@\[/g, '${' + RESULTS + '[');
            l = l.replace(/\${@/g, '${' + RESULTS + '.');
            lines.push(
                l.replace(/\$\{.+?}/g, (expr) => {
                    return resolve(expr, context, options?.trusted);
                })
            );
        } catch (err: any) {
            if (err.message === `${RESULTS} is not defined`) {
                err.message = 'No previous results found';
            }
            options?.logger?.error(`Error in expression:\n${line}\n** ${err.message} **`);
            options?.logger?.debug(`${err}`, err);
            lines.push(line);
        }
    }
    return lines.join('\n');
};
