import { Request } from './request';
import { Response, PlyResponse } from './response';
import { Options } from './options';
import { Logger } from './logger';
import { CodeLine, Code } from './code';
import { Compare, Diff } from './compare';
import { lines } from './util';

export interface Outcome {
    /**
     * Status of test execution
     */
    status: 'Pending' | 'Passed' | 'Failed' | 'Errored' | 'Not Verified'
    message: string
    /**
     * One-based line number of first diff, relative to starting line of test
     */
    line?: number
    /**
     * Diff message
     */
    diff?: string
    diffs?: Diff[]
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

    status: 'Pending' | 'Passed' | 'Failed' | 'Errored' | 'Not Verified' = 'Pending';
    message: string = '';
    line: number = 0;
    diff?: string;
    request: Request;
    response: PlyResponse;

    constructor(readonly name: string, request: Request, response: PlyResponse) {
        this.request = { ... request };
        this.request.headers = { };
        Object.keys(request.headers).forEach( key => {
            if (key !== 'Authorization') {
                this.request.headers[key] = request.headers[key];
            }
        });
        this.response = response;
    }

    /**
     * Returns the result with request/response bodies as objects (if parseable).
     */
    getResult(options: Options): Result {
        // TODO: request
        return {
            name: this.name,
            status: this.status,
            message: this.message,
            request: this.request,
            response: this.response?.getResponse(options, false)
        };
    }

    merge(outcome: Outcome) {
        this.status = outcome.status;
        this.message = outcome.message;
        this.line = outcome.line || 0;
        this.diff = outcome.diff;
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
     * Diffs/messages always contain \n newlines.
     */
    verify(actualYaml: string, values: object): Outcome {
        this.logger.debug(`Expected:\n${this.expectedYaml}\n` +
                `Actual:\n${actualYaml}\n`);
        const expected = new Code(this.expectedYaml, '#');
        const actual = new Code(actualYaml, '#');
        const diffs = new Compare(this.logger).diffLines(expected.extractCode(), actual.extractCode(), values);
        let firstDiffLine = 0;
        let diffMsg = '';
        if (diffs) {
            let line = 1;
            let actLine = 1;
            for (let i = 0; i < diffs.length; i++) {
                const diff = diffs[i];
                if (diff.removed) {
                    const correspondingAdd = (i < diffs.length - 1 && diffs[i + 1].added) ? diffs[i + 1] : null;
                    if (!diff.ignored) {
                        if (!firstDiffLine) {
                            firstDiffLine = line + this.startLine;
                        }
                        diffMsg += (line + this.startLine);
                        if (diff.count > 1) {
                            diffMsg += '-' + (line + this.startLine + diff.count - 1);
                        }
                        diffMsg += '\n';
                        diffMsg += this.prefix(diff.value, '- ', expected.lines, line);
                        if (correspondingAdd) {
                            diffMsg += this.prefix(correspondingAdd.value, '+ ', actual.lines, actLine);
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
                        diffMsg += this.prefix(diff.value, '+ ', actual.lines, actLine);
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
                line: firstDiffLine,
                diff: diffMsg,
                diffs
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
        return lines(str).reduce((a, seg, i, arr) => {
            let line = i === arr.length - 1 && seg.length === 0 ? '' : pre + seg;
            if (line) {
                if (codeLines) {
                    const codeLine = codeLines[start + i];
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