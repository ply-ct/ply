'use strict';

const path = require('path');
const arg = require('arg');
const Options = require('./options').Options;
const ply = require('./ply.js');

function parse(raw) {
  let args = arg(
    {
      '--help': Boolean,
      '--version': Boolean,
      '--debug': Boolean,
      '--values': [String],

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
}

const cli = {
  run: function(args) {
    let parsed = parse(args);
    if (parsed.help) {
      console.log(help);
    }
    else {
      let plyees = parsed._;
      let options = new Options(parsed).options;
      let logger = ply.getLogger(options);
      logger.debug('options: ' + JSON.stringify(options, null, 2));
      let values = {};
      if (options.values) {
        options.values.forEach(vals => {
          Object.assign(values, ply.loadValues(vals));
        });
      }
      plyees.forEach(plyee => {
        logger.info('Plying: ' + plyee + '...');
        options.location = path.dirname(plyee);
        if (isRequest(plyee)) {
          runRequest(plyee, options, values);
        }
        else {
          runCase(plyee, options, values);
        }
      });
    }
  }
};

function isRequest(plyee) {
  return !plyee.endsWith('.js');
}

function runRequest(requestFile, options, values) {
  const requests = ply.loadRequests(requestFile);
  Object.keys(requests).forEach(name => {
    let request = requests[name];
    request.run(options, values, name)
    .then(response => {
      // load results
      const expected = ply.loadFile(options.location + '/results/expected/movies-api/movie-queries.yaml');
      if (!expected) {
        throw new Error("Expected result not found: " + 'xxx');
      }
      // compare expected vs actual
      const res = request.implicitCase.verifyResult(expected, values);
    })
    .catch(err => {
      request.implicitCase.handleError(err);
    });
  });
}

function runCase(caseFile, options, values) {
  console.log("Case: " + caseFile);
}

const help = 'ply [options] one.request.yaml|case1.ply.js [two.request.yaml|case2.ply.js]\n' +
'Options:\n' +
'  -h, --help                   This help output\n' +
'  -d, -v, --debug, --verbose   Debug logging output (false)\n' +
'  --values                     Values JSON file\n' +
'  --extensions                 Filename extensions for requests ([.request.yaml,.postman_collections.json])\n' +
'  --expectedResultLocation     Expected results YAML location ([cwd]/results/expected)\n' +
'  --resultLocation             Where to write actual results YAML ([cwd]/results/actual)\n' +
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

