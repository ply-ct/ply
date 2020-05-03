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
 */
export function replace(template: string, context: object, logger: Logger) {
    return get(template, context, logger);
}

export type CodeLine = { code: string, comment?: string};

/**
 * Adds pre to the beginning of each line in str (except trailing newline).
 * Optional codeLines, start to restore comments.
 */
export function prefix(str: string, pre: string, codeLines: CodeLine[], start: number) {
    return str.split(/\n/).reduce((a, seg, i, arr) => {
        var line = i === arr.length - 1 && seg.length === 0 ? '' : pre + seg;
        if (line) {
            if (codeLines) {
                var codeLine = codeLines[start + i];
                if (codeLine.comment) {
                    line += codeLine.comment;
                }
            }
            line += '\n';
        }
        return a + line;
    }, '');
}
/**
 * Removes trailing # comments, along with any preceding whitespace.
 * Returns an array of objects (one for each line) to be passed to extractCode.
 */
export function trimComments(code: string): CodeLine[] {
    var lines: CodeLine[] = [];
    code.split(/\n/).forEach(line => {
        var segs = line.split(/(\s*#)/);
        var ln: CodeLine = { code: segs[0] };
        if (segs.length > 1) {
            ln.comment = segs.reduce((c, seg, i) => i > 1 ? c + seg : seg, '');
        }
        lines.push(ln);
    });
    return lines;
}

export function extractCode(lines: CodeLine[], withComments = false) {
    return lines.reduce((acc, line, i, lines) => {
        return acc + line.code + (line.comment && withComments ? line.comment : '') + (i < lines.length - 1 ? '\n' : '');
    }, '');
}
