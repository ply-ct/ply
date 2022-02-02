import { Logger } from './logger';
import { RESULTS } from './names';
import * as util from './util';

/**
 * duplicated in vscode-ply/media/values.ts
 */
function get(input: string, context: object): string {

    if (input.startsWith('${~')) return input; // ignore regex

    // escape all \
    let path = input.replace(/\\/g, '\\\\');
    // trim ${ and }
    path = path.substring(2, path.length - 1);

    // directly contains expression (flat obj or user-entered values in vscode)
    const type = typeof (context as any)[path];
    if (type === 'string' || type === 'number' || type === 'boolean') {
        return (context as any)[path];
    }

    let res: any = context;
    for (const seg of tokenize(path)) {
        if (!res[seg]) return input;
        res = res[seg];
    }

    return '' + res;
}

export function tokenize(path: string): (string | number)[] {
    return path.split(/\.(?![^[]*])/).reduce((segs: (string | number)[], seg) => {
        if (seg.search(/\[.+?]$/) > 0) {
            // indexer(s)
            const start = seg.indexOf('[');
            segs.push(seg.substring(0, start));
            let remains = seg.substring(start);
            while (remains.length > 0) {
                const indexer = remains.substring(1, remains.indexOf(']'));
                if ((indexer.startsWith("'") && indexer.startsWith("'")) ||
                        (indexer.endsWith('"') && indexer.endsWith('"'))) {
                    segs.push(indexer.substring(1, indexer.length - 1));  // object property
                } else {
                    segs.push(parseInt(indexer)); // array index
                }
                remains = remains.substring(indexer.length + 2);
            }
        } else {
            segs.push(seg);
        }
        return segs;
    }, []);
}

/**
 * Replaces template expressions with values from context (per line).
 * Supports a limited subset of template literal expressions
 * Ignores regular expressions starting with ${~.
 * Resulting newlines are always \n
 */
export function replace(template: string, context: object, logger: Logger): string {
    const lines: string[] = [];
    for (const line of util.lines(template)) {
        try {
            let l = line.replace(/\${@\[/g, '${' + RESULTS + '[');
            l = l.replace(/\${@/g, '${' + RESULTS + '.');
            lines.push(l.replace(/\$\{.+?}/g, expr => get(expr, context)));
        } catch (err: any) {
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

