export type CodeLine = { code: string, comment?: string };

export class Code {

    lines: CodeLine[];

    constructor(code: string, commentDelim: string = '#') {
        this.lines = this.trimComments(code.trimRight() + '\n', commentDelim);
    }

    /**
     * Removes trailing comments, along with any preceding whitespace.
     * Returns an array of objects (one for each line) to be passed to extractCode.
     */
    trimComments(code: string, delim: string): CodeLine[] {
        const lines: CodeLine[] = [];
        const regex = new RegExp('(\\s*' + delim + ')', 'g');
        code.replace(/\r/g, '').split(/\n/).forEach(line => {
            var segs = line.split(regex);
            var ln: CodeLine = { code: segs[0] };
            if (segs.length > 1) {
                ln.comment = segs.reduce((c, seg, i) => i > 1 ? c + seg : seg, '');
            }
            lines.push(ln);
        });
        return lines;
    }

    extractCode(withComments = false): string {
        return this.lines.reduce((acc, line, i, lines) => {
            return acc + line.code + (line.comment && withComments ? line.comment : '') + (i < lines.length - 1 ? '\n' : '');
        }, '');
    }

}