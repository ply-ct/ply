import { Log } from './logger';
import { RESULTS } from './names';
import * as util from './util';

/**
 * duplicated in vscode-ply/media/values.ts
 */
export function get(input: string, context: any): string {
    if (input.startsWith('${~')) return input; // ignore regex

    // escape all \
    let path = input.replace(/\\/g, '\\\\');
    // trim ${ and }
    path = path.substring(2, path.length - 1);

    // directly contains expression (flat obj or user-entered values in vscode)
    const type = typeof context[path];
    if (type === 'string' || type === 'number' || type === 'boolean') {
        return context[path];
    }

    let res: any = context;
    for (const seg of tokenize(path, context)) {
        if (!res[seg]) return input;
        res = res[seg];
    }

    return '' + res;
}

export function trustedGet(input: string, context: any): string {
    if (input.startsWith('${~')) return input; // ignore regex

    let expr = input;
    if (!(expr.startsWith('${') && expr.endsWith('}'))) {
        expr = '${' + expr + '}';
    }
    const fun = new Function(...Object.keys(context), 'return `' + expr + '`');
    return fun(...Object.values(context));
}

export function tokenize(path: string, context: any): (string | number)[] {
    return path.split(/\.(?![^[]*])/).reduce((segs: (string | number)[], seg) => {
        if (seg.search(/\[.+?]$/) > 0) {
            // indexer(s)
            const start = seg.indexOf('[');
            segs.push(seg.substring(0, start));
            let remains = seg.substring(start);
            while (remains.length > 0) {
                const indexer = remains.substring(1, remains.indexOf(']'));
                if (
                    (indexer.startsWith("'") && indexer.startsWith("'")) ||
                    (indexer.endsWith('"') && indexer.endsWith('"'))
                ) {
                    segs.push(indexer.substring(1, indexer.length - 1)); // object property
                } else {
                    let idx = parseInt(indexer);
                    if (isNaN(idx)) {
                        // indexer is expression
                        const val = get('${' + indexer + '}', context);
                        idx = parseInt(val);
                        if (isNaN(idx)) {
                            segs.push(val);
                        } else {
                            segs.push(idx); // array index
                        }
                    } else {
                        segs.push(idx); // array index
                    }
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
 * Replaces template expressions with values from context (per line), with template literal
 * syntax. Untrusted supports a limited subset of template literal. Ignores regular expressions
 * starting with ${~. * Resulting newlines are always \n.
 */
export function replace(template: string, context: object, logger: Log, trusted = false): string {
    const lines: string[] = [];
    for (const line of util.lines(template)) {
        try {
            let l = line.replace(/\${@\[/g, '${' + RESULTS + '[');
            l = l.replace(/\${@/g, '${' + RESULTS + '.');
            lines.push(
                l.replace(/\$\{.+?}/g, (expr) => {
                    return trusted ? trustedGet(expr, context) : get(expr, context);
                })
            );
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
