import { EOL } from 'os';
import * as jsYaml from 'js-yaml';
import * as util from './util';

export interface Yaml {
    start: number;
    text: string;
}

export function dump(obj: object, indent: number): string {
    return jsYaml.dump(obj, { noCompatMode: true, skipInvalid: true, indent, lineWidth: -1 });
}

/**
 * @param assignLines Here 'force' converts strings, numbers, booleans and nulls to objects
 * so that they can contain __start && __end properties (__ prop contains raw value).
 */
export function load(file: string, contents: string, assignLines: boolean | 'force' = false): any {
    const lines: any = {};
    const loadOptions: jsYaml.LoadOptions = { filename: file };
    if (assignLines) {
        loadOptions.listener = function (op, state) {
            if (
                assignLines &&
                op === 'open' &&
                state.kind === 'scalar' &&
                state.lineIndent === 0 /* && lines[state.result] === undefined */
            ) {
                lines[state.result] = state.line;
            }
        };
    }
    const obj = jsYaml.load(contents, loadOptions) as any;
    if (obj && assignLines) {
        const contentLines = util.lines(contents);
        let lastObjProp: any;
        Object.keys(obj).forEach((key) => {
            const line = lines[key];
            if (typeof line !== 'undefined') {
                if (typeof obj[key] === 'object') {
                    if (!obj[key]) {
                        obj[key] = {};
                    }
                    const objProp = obj[key];
                    objProp.__start = line;
                    if (
                        lastObjProp &&
                        typeof lastObjProp.__start !== 'undefined' &&
                        typeof objProp.__start !== 'undefined'
                    ) {
                        lastObjProp.__end = getEndLine(
                            contentLines,
                            lastObjProp.__start,
                            objProp.__start - 1
                        );
                    }
                    lastObjProp = objProp;
                } else if (assignLines === 'force' && obj[key] !== undefined) {
                    obj[key] = {
                        __: obj[key],
                        __start: line,
                        __end: line
                    };
                }
            }
        });
        if (lastObjProp && typeof lastObjProp.__start !== 'undefined') {
            lastObjProp.__end = getEndLine(contentLines, lastObjProp.__start);
        }
    }
    return obj;
}

function getEndLine(
    contentLines: string[],
    start: number,
    end: number | undefined = undefined
): number {
    const reversedLines = getLines(contentLines, start, end).reverse();
    let endLine = typeof end === 'undefined' ? start + reversedLines.length - 1 : end;
    for (let i = 0; i < reversedLines.length && endLine > start; i++) {
        const line = reversedLines[i].trim();
        if (!line || line.startsWith('#')) {
            endLine--;
        } else {
            break;
        }
    }
    return endLine;
}

/**
 * Returns content lines where index is between start and end - 1.
 * If end is not supplied, read to end of contentLines array.
 */
function getLines(contentLines: string[], start: number, end?: number): string[] {
    return contentLines.reduce((lines: string[], line: string, i: number) => {
        if (i >= start && (!end || i <= end)) {
            lines.push(line);
        }
        return lines;
    }, new Array<string>());
}

function isCommentOrBlank(line: string) {
    const trimmed = line.trim();
    return !trimmed || trimmed.startsWith('#');
}

/**
 * Merge a raw object into yaml content, respecting existing comments.
 */
export function merge(file: string, yaml: string, delta: any, indent = 2): string {
    const yamlLines = util.lines(yaml);
    const outLines: string[] = [];
    const curObj = load(file, yaml, 'force');
    const curKeys = Object.keys(curObj);
    const delKeys = Object.keys(delta);

    const trailingBlanksAndComments = (lines: string[]) => {
        const trailers: string[] = [];
        for (let i = lines.length - 1; i >= 0; i--) {
            if (isCommentOrBlank(lines[i])) {
                trailers.unshift(lines[i]);
            } else {
                return trailers;
            }
        }
        return trailers;
    };

    // leading comments and blanks
    for (const yamlLine of yamlLines) {
        if (isCommentOrBlank(yamlLine)) {
            outLines.push(yamlLine);
        } else {
            break;
        }
    }

    for (let i = 0; i < curKeys.length; i++) {
        const key = curKeys[i];
        const keyObj = curObj[key];

        let curLines: string[];
        if (i < curKeys.length - 1) {
            const nextObj = curObj[curKeys[i + 1]];
            curLines = yamlLines.slice(keyObj.__start, nextObj.__start);
        } else {
            curLines = yamlLines.slice(keyObj.__start, yamlLines.length);
        }

        if (delKeys.includes(key)) {
            const delVal = delta[key];
            if (delVal !== undefined) {
                const delLines = util.lines(dump({ [key]: delVal }, indent));
                outLines.push(...delLines.slice(0, delLines.length - 1));
            }
            const trailing = trailingBlanksAndComments(curLines);
            outLines.push(...trailing);
        } else {
            if (i < curKeys.length - 1) {
                outLines.push(...curLines);
            }
        }
    }

    // append delta additions
    for (const key of delKeys) {
        const delVal = delta[key];
        if (delVal !== undefined && !curKeys.includes(key)) {
            outLines.push(...util.lines(dump({ [key]: delVal }, indent)));
        }
    }

    return outLines.join(EOL);
}
