'use strict';

const arg = require('arg');
const Options = require('./options').Options;

function parse(raw) {
  let args = arg(
    {
      '--help': Boolean,
      '--version': Boolean,
      '--debug': Boolean,

      // aliases
      '-h': '--help',
      '--verbose': '--debug',
      '-d': '--debug',
      '-v': '--debug'
    },
    {
      argv: raw.slice(2),
    }
  );
  let parsed = {};
  Object.keys(args).forEach(arg => {
    if (arg.startsWith('--')) {
      parsed[arg.substring(2)] = args[arg];
    }
    else {
      parsed[arg] = args[arg];
    }
  });
  return parsed;
};

const cli = {
  run: function(args) {
    let parsed = parse(args);
    if (parsed.help) {
      console.log(help);
    }
    else {
      let plyees = parsed._;
      let options = new Options(parsed).options;
      console.log("Plying: " + JSON.stringify(plyees));
      console.log("options: " + JSON.stringify(options, null, 2));
    }
  }
};

const help = 'ply [options] one.request.yaml|case1.ply.js [two.request.yaml|case2.ply.js]\n' +
'Options:\n' +
'  -h, --help                   This help output\n' +
'  -d, -v, --debug, --verbose   Debug logging output (false)\n' +
'  --location                   File system location or URL (path.dirname(process.argv[1])\n' +
'  --extensions                 Filename extensions for requests ([.request.yaml,.postman_collections.json])\n' +
'  --expectedResultLocation     Expected results YAML location (same as *location*)\n' +
'  --resultLocation             Where to write actual results YAML ("results")\n' +
'  --logLocation                Where logs are written (same as *resultLocation*)\n' +
'  --retainLog                  Append to log for each test instead of overwriting (false)\n' +
'  --captureResult              Whether test results should be saved (true) -- set false for pre-script cleanup, etc.\n' +
'  --retainResult               Append to result file instead of overwriting (false)\n' +
'  --formatResult               Pretty-print and sort keys of JSON body content in results (true) -- for comparision vs expected\n' +
'  --prettyIndent               Pretty-print indentation (2)\n' +
'  --qualifyLocations           Result and log paths prefixed by group (true) -- or can be string for custom\n' +
'  --overwriteExpected          Save actual result as expected result (false) -- use for initial creation\n' +
'  --responseHeaders            Array of validated response headers, in the order they\'ll appear in result YAML (all)';

module.exports = cli;

