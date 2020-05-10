import * as subst from './subst';
import { Logger } from './logger';
import { Compare } from './compare';
import { Result } from './result';

/**
 * Verify expected vs actual results yaml after substituting values.
 */
export default function verify(expectedYaml: string, actualYaml: string, values: object, logger: Logger, startLine: number = 0): Result {
    logger.debug(`Comparing:\n${expectedYaml}\nWith:\n${actualYaml}\n`);
    const expected = subst.trimComments(expectedYaml.trimRight().replace(/\r/g, '') + '\n');
    const actual = subst.trimComments(actualYaml.trimRight().replace(/\r/g, '') + '\n');
    const diffs = new Compare(logger).diffLines(subst.extractCode(expected), subst.extractCode(actual), values);
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
                        firstDiffLine = line + startLine;
                    }
                    diffMsg += (line + startLine);
                    if (diff.count > 1) {
                        diffMsg += '-' + (line + startLine + diff.count - 1);
                    }
                    diffMsg += '\n';
                    diffMsg += subst.prefix(diff.value, '- ', expected, line + startLine - 1);
                    if (correspondingAdd) {
                        diffMsg += subst.prefix(correspondingAdd.value, '+ ', actual, actLine + startLine - 1);
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
                        firstDiffLine = line + startLine;
                    }
                    diffMsg += line + '\n';
                    diffMsg += subst.prefix(diff.value, '+ ', actual, actLine + startLine - 1);
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
        return { status: 'Failed', message: `Results differ from line ${firstDiffLine}`, line: firstDiffLine, diff: diffMsg };
    }
    else {
        return { status: 'Passed', message: 'Test succeeded', line: 0 };
    }
}
