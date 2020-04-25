import * as jsYaml from 'js-yaml';

export function dump(obj, indent) {
    return jsYaml.safeDump(obj, { noCompatMode: true, skipInvalid: true, indent, lineWidth: -1 });
}

export function load(file, contents) {
    const lines = {};
    const obj = jsYaml.safeLoad(contents, {
        filename: file,
        listener: function (op, state) {
            if (op === 'open' && state.kind === 'scalar') {
                lines[state.result] = state.line;
            }
        }
    });
    Object.keys(obj).forEach(key => {
        let line = lines[key];
        if (typeof line !== 'undefined' && typeof obj[key] === 'object') {
            obj[key].__line = line;
        }
    });
    return obj;
}

