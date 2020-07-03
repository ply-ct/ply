import { Logger } from './logger';

/**
 * Evaluate the template expression per context
 */
function get(template: string, context: object, logger: Logger): string {
    try {
        const handler = new Function('context', [
            'const tagged = (' + Object.keys(context).join(', ') + ') => {',
            '    return `' + template + '`;',
            '}',
            'return tagged(...Object.values(context))'
        ].join('\n'));
        return handler(context);
    }
    catch (err) {
        logger.debug(`Error handling expression '${template}'`, err);
        return template;
    }
}

/**
 * Replaces template expressions with values from context.
 * Ignores regular expressions starting with ${~
 */
export function replace(template: string, context: object, logger: Logger) {
    return get(template.replace(/\${~/g, '\\${~'), context, logger);
}

