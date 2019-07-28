'use strict';

const path = require('path');
const arg = require('arg');
const Options = require('./options').Options;
const ply = require('./ply.js');
const Case = ply.Case;

const help = 'ply [options] one.request.yaml|case1.ply.js [two.request.yaml|case2.ply.js]\n' +
  'Options:\n' +
  '  -h, --help                   This help output\n' +
  '  -d, -v, --debug, --verbose   Debug logging output (false)\n' +
  '  --values                     Values JSON file\n' +
  '  --expectedResultLocation     Expected results YAML location ([cwd]/results/expected)\n' +
  '  --resultLocation             Where to write actual results YAML ([cwd]/results/actual)\n' +
  '  --logLocation                Where logs are written (same as *resultLocation*)\n' +
  '  --extensions                 Filename extensions for requests ([.request.yaml,.postman_collections.json])\n' +
  '  --responseHeaders            Array of validated response headers, in the order they\'ll appear in result YAML (all)\n' +
  '  --formatResult               Pretty-print and sort keys of JSON body content in results (true) -- for comparision vs expected\n' +
  '  --prettyIndent               Pretty-print indentation (2)\n' +
  '  --retainLog                  Append to log for each test instead of overwriting (false)\n' +
  '  --captureResult              Whether test results should be saved (true) -- set false for pre-script cleanup, etc.\n' +
  '  --retainResult               Append to result file instead of overwriting (false)\n' +
  '  --overwriteExpected          Save actual result as expected result (false) -- use for initial creation';

function parse(raw) {
  let args = arg(
    {
      '--help': Boolean,
      '--version': Boolean,
      '--debug': Boolean,
      '--values': [String],
      '--expectedResultLocation': String,
      '--resultLocation': String,
      '--logLocation': String,
      '--extensions': [String],
      '--responseHeaders': [String],
      '--formatResult': String, // boolean w/default = true
      '--prettyIndent': Number,
      '--retainLog': Boolean,
      '--captureResult': String, // boolean w/default = true
      '--retainResult': Boolean,
      '--overwriteExpected': Boolean,

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
      if (arg === '--formatResult' || arg === '--captureResult') {
        parsed[arg.substring(2)] = args[arg] === 'true';
      }
      else {
        parsed[arg.substring(2)] = args[arg];
      }
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
      options.location = process.cwd();
      let logger = ply.getLogger(options);
      logger.debug('options: ' + JSON.stringify(options, null, 2));
      let values = {};
      if (options.values) {
        options.values.forEach(vals => {
          Object.assign(values, ply.loadValues(vals));
        });
      }
      options.qualifyLocations = false;
      plyees.filter(p => isRequest(p)).forEach(requestFile => {
        logger.info('Plying: ' + requestFile + '...');
        runRequests(requestFile, options, values);
      });
    }
  }
};

function isRequest(plyee) {
  return !plyee.endsWith('.js');
}

function runRequests(requestFile, options, values) {
  const requests = ply.loadRequests(requestFile);
  const caseName = getCaseName(requestFile, options.extensions);
  const testCase = new Case(caseName, options);

  // tests are run sequentially
  Object.keys(requests).reduce((promise, name) => {
    return promise.then(() => {
      let request = requests[name];
      return testCase.run(request, values, name);
    });
  }, Promise.resolve())
  .then(() => {
      testCase.verify(values)
  })
  .catch(err => {
    testCase.handleError(err);
  });
}

function runCase(caseFile, options, values) {
  console.log("Case: " + caseFile);
}

function getCaseName(requestFile, extensions) {
  let fileName = path.basename(requestFile);
  if (extensions && extensions.length > 0) {
    for (let i = 0; i < extensions.length; i++) {
      if (fileName.endsWith(extensions[i])) {
        return fileName.substring(0, fileName.length - extensions[i].length);
      }
    }
  }
  return fileName;
}

module.exports = cli;

