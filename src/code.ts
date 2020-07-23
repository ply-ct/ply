import './string';

export type CodeLine = { code: string, comment?: string };

export class Code {

    lines: CodeLine[];

    constructor(code: string, commentDelim: string)
    constructor(code: string[], commentDelim: string);
    constructor(code: string | string[], commentDelim: string) {
        if (typeof code === 'string') {
            this.lines = this.trimComments((code.trimRight()  + '\n').lines(), commentDelim);
        }
        else {
            this.lines = this.trimComments(code, commentDelim);
        }
    }

    /**
     * Removes trailing comments, along with any preceding whitespace.
     * Returns an array of objects (one for each line) to be passed to extractCode.
     */
    trimComments(inLines: string[], delim: string): CodeLine[] {
        const lines: CodeLine[] = [];
        const regex = new RegExp('(\\s*' + delim + ')', 'g');
        inLines.forEach(line => {
            const segs = line.split(regex);
            const ln: CodeLine = { code: segs[0] };
            if (segs.length > 1) {
                ln.comment = segs.reduce((c, seg, i) => i > 1 ? c + seg : seg, '');
            }
            lines.push(ln);
        });
        return lines;
    }

    /**
     * All newlines are \n
     */
    extractCode(withComments = false): string {
        return this.lines.reduce((acc, line, i, lines) => {
            return acc + line.code + (line.comment && withComments ? line.comment : '') + (i < lines.length - 1 ? '\n' : '');
        }, '');
    }

}