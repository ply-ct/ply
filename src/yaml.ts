const jsYaml = require('js-yaml');

export class Yaml {
    private obj: object;

    constructor(private readonly filename: string, private readonly contents: string) {
        const lines = {};
        this.obj = jsYaml.safeLoad(contents, {
            filename, listener: function(op: string, state: any) {
                if (op === 'open' && state.kind === 'scalar' && typeof (state.line) !== 'undefined') {
                    lines[state.result] = state.line;
                }
            }
        });
        Object.keys(this.obj).forEach(key => {
            let line = lines[key];
            if (typeof (line) !== 'undefined') {
                obj[key].line = line;
            }
        });
    }
}