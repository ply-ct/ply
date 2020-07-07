import { Logger } from './logger';

/**
 * Evaluate the input expression vs context.
 */
function get(input: string, context: object, logger: Logger, explain = false): string {
        const params = [
            'const tagged = (' + Object.keys(context).join(', ') + ') => {',
            '    return `' + input + '`;',
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
    for (const line of template.split(/\r?\n/)) {
        try {
            lines.push(get(line.replace(/\${~/g, '\\${~'), context, logger, explain));
        } catch (err) {
            logger.error(`Error in expression:\n${line}\n** ${err.message} **`);
            logger.debug(err.stack);
            lines.push(line);
        }
    }
    return lines.join('\n');
}

