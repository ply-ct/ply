const jsYaml = require('js-yaml');

module.exports = {
    // loads with line numbers
    load: function (file, contents) {
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
                obj[key].line = line;
            }
        });
        return obj;
    },
    dump: function (obj) {
        return jsYaml.safeDump(obj, { noCompatMode: true, skipInvalid: true, lineWidth: -1 });
    }
};
