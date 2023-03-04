import { EOL } from 'os';
import { parse, modify, applyEdits, Edit, ParseError, printParseErrorCode } from 'jsonc-parser';

export function parseJsonc(file: string, input: string): any {
    const errs: ParseError[] = [];
    const output = parse(input, errs);
    printErrors(file, errs);
    return output;
}

function printErrors(file: string, errors: ParseError[]) {
    if (errors.length > 0) {
        console.error(`jsonc-parser errors in ${file}:`);
        for (const err of errors) {
            const label = printParseErrorCode(err.error);
            console.error(` - ${label}:` + JSON.stringify(err));
        }
        console.log('');
    }
}

/**
 * Merge a raw object into jsonc content, respecting existing comments.
 */
export function merge(file: string, json: string, delta: any, indent = 2): string {
    try {
        const edits: Edit[] = [];
        Object.keys(delta).forEach((key) => {
            edits.push(
                ...modify(json, [key], delta[key], {
                    formattingOptions: { tabSize: indent, insertSpaces: true, eol: EOL }
                })
            );
        });
        return applyEdits(json, edits);
    } catch (err: unknown) {
        console.error(err);
        throw new Error(`Error creating edits for file ${file}: ${err}`);
    }
}
