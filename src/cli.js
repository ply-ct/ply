'use strict';

const path = require('path');
const arg = require('arg');
const Options = require('./options').Options;
const ply = require('./ply.js');
const Case = ply.Case;

const help = 'ply [options] one.ply.yaml[#aRequest]|case1.ply.js [two.ply.yaml|case2.ply.js]\n' +
  'Options:\n' +
  '  -h, --help                   This help output\n' +
  '  -d, -v, --debug, --verbose   Debug logging output (false)\n' +
  '  --values                     Values JSON file\n' +
  '  --expectedResultLocation     Expected results YAML location ([cwd]/results/expected)\n' +
  '  --resultLocation             Where to write actual results YAML ([cwd]/results/actual)\n' +
  '  --logLocation                Where logs are written (same as *resultLocation*)\n' +
  '  --extensions                 Filename extensions for requests ([.ply.yaml,.postman_collections.json])\n' +
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
  init: function(plyees, parsedArgs) {
    this.plyees = plyees;
    this.options = new Options(parsedArgs).options;
    this.options.location = process.cwd();
    this.logger = ply.getLogger(this.options);
    this.logger.debug('options: ' + JSON.stringify(this.options, null, 2));
    this.values = {};
    if (this.options.values) {
      this.options.values.forEach(vals => {
        Object.assign(this.values, ply.loadValues(vals));
      });
    }
  },
  run: function(args) {
    let parsed = parse(args);
    if (parsed.help) {
      console.log(help);
    }
    else {
      this.init(parsed._, parsed);
      this.plyees.filter(p => this.isRequest(p)).forEach(req => {
        let name = undefined;
        let hash = req.lastIndexOf('#');
        if (hash > 0 && req.length > hash + 1) {
          name = req.substring(hash + 1);
          req = req.substring(0, hash);
        }
        this.runRequests(req, name);
      });
    }
  },
  isRequest: function(plyee) {
    return !plyee.endsWith('.js');
  },
  runRequests: function(requestFile, requestName) {
    //let requests = ply.loadRequests(requestFile);
    ply.loadRequestsAsync(requestFile)
    .then(requests => {
      if (requestName) {
        // single test
        this.options.qualifyLocations = false;
        this.options.storageSuffix = true;
        const request = requests[requestName];
        if (request) {
          this.logger.info('Plying: ' + requestFile + '#' + requestName + '...');
          let baseName = this.getBaseName(requestFile);
          const testCase = new Case(baseName, this.options);
          testCase.run(request, this.values, request.name)
          .then(() => {
            testCase.verifyAsync(this.values, request.name)
            .then(result => {
              if (result.status !== 'Passed') {
                process.exit(result.lineNumber ? result.lineNumber : -1);
              }
            });
          })
          .catch(err => {
            testCase.handleError(err);
          });
        }
        else {
          throw new Error('Request not found: ' + requestFile + '#' + requestName);
        }
      }
      else {
        // tests are run sequentially with one case
        this.options.qualifyLocations = false;
        let caseName = this.getBaseName(requestFile);
        let testCase = new Case(caseName, this.options);
        Object.keys(requests).reduce((promise, name) => {
          return promise.then(() => {
            let request = requests[name];
            this.logger.info('Plying: ' + requestFile + '#' + name + '...');
            return testCase.run(request, this.values, name);
          })
          .catch(err => {
            testCase.handleError(err);
          });
        }, Promise.resolve())
        .then(() => {
            testCase.verifyAsync(this.values)
            .then(result => {
              if (result.status !== 'Passed') {
                process.exit(-1);
              }
            });
        })
        .catch(err => {
          testCase.handleError(err);
        });
      }
    });
  },
  getBaseName: function(requestFile) {
    let fileName = path.basename(requestFile);
    if (this.options.extensions && this.options.extensions.length > 0) {
      for (let i = 0; i < this.options.extensions.length; i++) {
        if (fileName.endsWith(this.options.extensions[i])) {
          return fileName.substring(0, fileName.length - this.options.extensions[i].length);
        }
      }
    }
    return fileName;
  }
};

module.exports = cli;

