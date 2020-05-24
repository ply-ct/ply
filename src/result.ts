import { Request } from './request';
import { Response } from './response';
import { Logger } from './logger';
import { CodeLine, Code } from './code';
import { Compare } from './compare';

export interface Outcome {
    /**
     * Status of test execution
     */
    status: 'Pending' | 'Passed' | 'Failed' | 'Errored'
    message: string
    /**
     * One-based, relative to starting line of test
     */
    line?: number
    /**
     * Diff message
     */
    diff?: string
}

export interface Result extends Outcome {
    /**
     * Request name
     */
    readonly name: string,
    /**
     * Request with runtime substitutions, minus Authorization header
     */
    readonly request?: Request,
    /**
     * Response with ignore headers removed, and formatted/sorted body content (per options)
     */
    readonly response?: Response
}

export class PlyResult implements Result {

    status: 'Pending' | 'Passed' | 'Failed' | 'Errored' = 'Pending';
    message: string = '';
    line: number = 0;
    diff?: string;
    request: Request;
    response: Response;

    constructor(readonly name: string, request: Request, response: Response) {
        this.request = { ... request };
        this.request.headers = { };
        Object.keys(request.headers).forEach( key => {
            if (key !== 'Authorization') {
                this.request.headers[key] = request.headers[key];
            }
        });
        this.response = response;
    }
}

export class Verifier {
    constructor(
        readonly expectedYaml: string,
        readonly logger: Logger,
        readonly startLine = 0
    ) {}

    /**
     * Verify expected vs actual results yaml after substituting values.
     */
    verify(actualYaml: string, values: object): Outcome {
        this.logger.debug(`Comparing:\n${this.expectedYaml}\nWith:\n${actualYaml}\n`);
        const expected = new Code(this.expectedYaml);
        const actual = new Code(actualYaml);
        const diffs = new Compare(this.logger).diffLines(expected.extractCode(), actual.extractCode(), values);
        var firstDiffLine = 0;
        var diffMsg = '';
        if (diffs) {
            let line = 1;
            let actLine = 1;
            for (let i = 0; i < diffs.length; i++) {
                let diff = diffs[i];
                if (diff.removed) {
                    let correspondingAdd = (i < diffs.length - 1 && diffs[i + 1].added) ? diffs[i + 1] : null;
                    if (!diff.ignored) {
                        if (!firstDiffLine) {
                            firstDiffLine = line + this.startLine;
                        }
                        diffMsg += (line + this.startLine);
                        if (diff.count > 1) {
                            diffMsg += '-' + (line + this.startLine + diff.count - 1);
                        }
                        diffMsg += '\n';
                        diffMsg += this.prefix(diff.value, '- ', expected.lines, line + this.startLine - 1);
                        if (correspondingAdd) {
                            diffMsg += this.prefix(correspondingAdd.value, '+ ', actual.lines, actLine + this.startLine - 1);
                        }
                        diffMsg += '===\n';
                    }
                    line += diff.count;
                    if (correspondingAdd) {
                        i++; // corresponding add already covered
                        actLine += correspondingAdd.count;
                    }
                }
                else if (diff.added) {
                    if (!diff.ignored) {
                        // added with no corresponding remove
                        if (!firstDiffLine) {
                            firstDiffLine = line + this.startLine;
                        }
                        diffMsg += line + '\n';
                        diffMsg += this.prefix(diff.value, '+ ', actual.lines, actLine + this.startLine - 1);
                        diffMsg += '===\n';
                    }
                    actLine += diff.count;
                }
                else {
                    line += diff.count;
                    actLine += diff.count;
                }
            }
        }
        if (firstDiffLine) {
            return {
                status: 'Failed',
                message: `Results differ from line ${firstDiffLine}`,
                line: firstDiffLine, diff: diffMsg
            };
        }
        else {
            return {
                status: 'Passed',
                message: 'Test succeeded',
                line: 0
            };
        }
    }

    /**
     * Adds pre to the beginning of each line in str (except trailing newline).
     * Optional codeLines, start to restore comments.
     */
    private prefix(str: string, pre: string, codeLines: CodeLine[], start: number): string {
        return str.replace(/\r/g, '').split(/\n/).reduce((a, seg, i, arr) => {
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

}