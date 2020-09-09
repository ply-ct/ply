import { Logger } from './logger';
import { RESULTS } from './names';
import * as util from './util';

/**
 * Evaluate the input expression vs context.
 */
function get(input: string, context: object, logger: Logger, explain = false): string {

    // escape all \, and escape regex $ prefix
    const escaped = input.replace(/\\/g, '\\\\').replace(/\${~/g, '\\${~');

    const params = [
        'const tagged = (' + Object.keys(context).join(', ') + ') => {',
        '    return `' + escaped + '`;',
        '}',
        'return tagged(...Object.values(context))'
    ].join('\n');

    if (explain) {
        logger.debug('params: ' + params);
    }

    const handler = new Function('context', params);
    return handler(context);
}

/**
 * Replaces template expressions with values from context (per line).
 * Ignores regular expressions starting with ${~.
 * Resulting newlines are always \n
 */
export function replace(template: string, context: object, logger: Logger, explain = false): string {
    const lines: string[] = [];
    for (const line of util.lines(template)) {
        try {
            const l = line.replace(/\${@/g, '${' + RESULTS + '.');
            lines.push(get(l, context, logger, explain));
        } catch (err) {
            if (err.message === `${RESULTS} is not defined`) {
                err.message = 'No previous results found';
            }
            logger.error(`Error in expression:\n${line}\n** ${err.message} **`);
            logger.debug(err);
            lines.push(line);
        }
    }
    return lines.join('\n');
}

