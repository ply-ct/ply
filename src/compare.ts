import { diff_match_patch as DiffMatchPatch, Diff as DmpDiff } from 'diff-match-patch';
import { CodeLine } from './code';
import { Logger } from './logger';
import * as subst from './subst';

/**
 * jsdiff object
 */
export type Diff = {
    added?: boolean
    removed?: boolean
    ignored?: boolean
    value: string
    count: number
}

export type Marker = {
    start: number
    end: number
    ignored?: boolean
}

export class Compare {

    constructor(readonly logger: Logger) {}

    diffLines(expected: string, actual: string, values: object) {
        const dmp = new DiffMatchPatch();
        var a = dmp.diff_linesToChars_(expected, actual);
        var lineText1 = a.chars1;
        var lineText2 = a.chars2;
        var lineArray = a.lineArray;
        var dmpDiffs = dmp.diff_main(lineText1, lineText2, false);
        dmp.diff_charsToLines_(dmpDiffs, lineArray);
        let jsDiffs = this.convertToJsDiff(dmpDiffs);
        if (values) {
            return this.markIgnored(jsDiffs, values);
        }
        else {
            return jsDiffs;
        }
    }

    private convertToJsDiff(diffs: DmpDiff[]): Diff[] {
        var jsdiffs: Diff[] = [];
        diffs.forEach(diff => {
            let jsdiff: Diff = {
                value: diff[1],
                count: diff[1].split(/\r\n|\r|\n/).length
            };
            if (diff[0] === -1) {
                jsdiff.removed = true;
            }
            else if (diff[0] === 1) {
                jsdiff.added = true;
            }
            if (jsdiff.value.endsWith('\n')) {
                jsdiff.count--;
            }
            jsdiffs.push(jsdiff);
        });
        return jsdiffs;
    }

    /**
     * Handles regex and @request/@response.
     */
    private markIgnored(diffs: Diff[], values: object) {
        for (let i = 0; i < diffs.length; i++) {
            if (diffs[i].removed && diffs.length > i + 1 && diffs[i + 1].added) {
                var exp = subst.replace(diffs[i].value, values, this.logger);
                var act = diffs[i + 1].value;
                if (exp === act) {
                    diffs[i].ignored = diffs[i + 1].ignored = true;
                }
                else if (exp.indexOf('${~') >= 0) {
                    // regex
                    var regex = exp.replace(/\$\{~.+?}/g, (match) => {
                        return '(' + match.substr(3, match.length - 4) + ')';
                    });
                    var match = act.match(new RegExp(regex));
                    if (match && match[0].length === act.length) {
                        diffs[i].ignored = diffs[i + 1].ignored = true;
                    }
                }
            }
        }
        return diffs;
    }

    /**
     * Used by ply-ui
     */
    mirrorDiffs(diffs: Diff[]): Diff[] {
        let mirroredDiffs = [];
        for (let i = 0; i < diffs.length; i++) {
            let diff = diffs[i];
            if (diff.removed) {
                let correspondingAdd = (i < diffs.length - 1 && diffs[i + 1].added) ? diffs[i + 1] : null;
                if (correspondingAdd) {
                    let remove = Object.assign({}, correspondingAdd);
                    delete remove.added;
                    remove.removed = true;
                    mirroredDiffs.push(remove);
                    i++; // corresponding add already covered
                }
                let add = Object.assign({}, diff);
                delete add.removed;
                add.added = true;
                mirroredDiffs.push(add);
            }
            else if (diff.added) {
                let rem = Object.assign({}, diff);
                delete rem.added;
                rem.removed = true;
                mirroredDiffs.push(rem);
            }
            else {
                mirroredDiffs.push(diff);
            }
        }
        return mirroredDiffs;
    }

    /**
     * Used by ply-ui
     */
    markLines(start: number, lines: string[], ignored: boolean) {
        var markers: Marker[] = [];
        var linesIdx = 0;
        lines.forEach(line => {
            var marker: Marker = {
                start: start + linesIdx,
                end: start + linesIdx + line.length + 1,
            };
            if (ignored) {
                marker.ignored = true;
            }
            markers.push(marker);
            linesIdx += line.length + 1;
        });
        return markers;
    }

    getMarkers(diffs: Diff[], lines: CodeLine[]) {
        var markers: Marker[] = [];
        if (diffs) {
            var idx = 0;
            var lineIdx = 0;
            for (let i = 0; i < diffs.length; i++) {
                var diff = diffs[i];
                if (diff.removed) {
                    var correspondingAdd = (i < diffs.length - 1 && diffs[i + 1].added) ? diffs[i + 1] : null;
                    var oldLines = diff.value.replace(/\n$/, '').split(/\n/);
                    if (correspondingAdd) {
                        // diff each line
                        var newLines = correspondingAdd.value.replace(/\n$/, '').split(/\n/);
                        const dmp = new DiffMatchPatch();
                        for (let j = 0; j < oldLines.length && j < newLines.length; j++) {
                            let dmpLineDiffs = dmp.diff_main(oldLines[j], newLines[j]);
                            dmp.diff_cleanupEfficiency(dmpLineDiffs);
                            let lineDiffs = this.convertToJsDiff(dmpLineDiffs);
                            lineDiffs.forEach(lineDiff => {
                                if (lineDiff.removed) {
                                    var marker: Marker = {
                                        start: idx,
                                        end: idx + lineDiff.value.length,
                                    };
                                    if (diff.ignored) {
                                        marker.ignored = true;
                                    }
                                    markers.push(marker);
                                    idx += lineDiff.value.length;
                                }
                                else if (!lineDiff.added) {
                                    idx += lineDiff.value.length;
                                }
                            });
                            idx++; // newLine
                        }
                        // TODO: handle oldLines > newLines or vice-versa
                    }
                    else {
                        // mark every line
                        markers.push.apply(markers, this.markLines(idx, oldLines, diff.ignored === true));
                    }

                    if (correspondingAdd) {
                        i++; // corresponding add already covered
                    }

                    // account for ignored comments
                    if (lines && lines[lineIdx].comment) {
                        idx += lines[lineIdx].comment?.length || 0;
                    }
                    lineIdx += diff.count;
                }
                else if (!diff.added) {
                    idx += diff.value.length;
                    // account for ignored comments
                    if (lines && lines[lineIdx].comment) {
                        idx += lines[lineIdx].comment?.length || 0;
                    }
                    lineIdx += diff.count;
                }
            }
        }

        return markers;
    }
}