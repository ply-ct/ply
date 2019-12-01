'use strict';

const path = require('path');
const EventEmitter = require('events').EventEmitter;
const arg = require('arg');
const Options = require('./options').Options;
const ply = require('./ply');
const Case = ply.Case;

const help = 'ply [options] one.ply.yaml[#aRequest]|case1.ply.js [two.ply.yaml|case2.ply.js]\n' +
  'Options:\n' +
  '  -h, --help                   This help output\n' +
  '  -d, -v, --debug, --verbose   Debug logging output (false)\n' +
  '  -b, --bail                   Exit after first failure\n' +
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
      '--bail': Boolean,
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
      '-v': '--debug',
      '-b': '--bail'
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
      this.exec()
      .then(success => {
        process.exitCode = (success ? 0 : -1);
      })
      .catch(error => {
        if (error.stack) {
          this.logger.error(error.stack);
        }
        else {
          this.logger.error(error);
        }
        process.exitCode = -1;
      });
    }
  },
  // This is the public api.
  // Listener is for 'start' and 'outcome' events.
  ply: async function(plyees, options, values, listener) {
    this.plyees = plyees;
    this.options = new Options(options).options;
    this.values = values;
    this.logger = ply.getLogger(this.options);
    this.logger.debug('options: ' + JSON.stringify(this.options, null, 2));
    if (listener) {
      this.emitter = new EventEmitter();
      this.emitter.on('start', listener);
      this.emitter.on('outcome', listener);
    }
    return this.exec();
  },
  exec: function() {
    return new Promise(resolve => {
      let success = true;
      this.plyees.reduce((promise, plyee) => {
        return promise.then(() => {
          return new Promise(res => {
            if (this.options.bail && !success) {
              res();
            }
            else {
              if (this.isRequests(plyee)) {
                let name = undefined;
                let hash = plyee.lastIndexOf('#');
                if (hash > 0 && plyee.length > hash + 1) {
                  name = plyee.substring(hash + 1);
                  plyee = plyee.substring(0, hash);
                }
                this.runRequests(plyee, name)
                .then(plyeeSuccess => {
                  if (!plyeeSuccess) {
                    success = false;
                  }
                  res();
                });
              }
              else {
                // TODO run case
              }
            }
          });
        });
      }, Promise.resolve())
      .then(() => {
        resolve(success);
      });
    });
  },
  isRequests: function(plyee) {
    return !plyee.endsWith('.js');
  },
  runRequests: function(requestFile, requestName) {
    return new Promise(resolve => {
      ply.loadRequestsAsync(requestFile)
      .then(requests => {
        this.options.qualifyLocations = false;
        this.options.storageSuffix = true;
        if (requestName) {
          // single request
          const request = requests[requestName];
          if (request) {
            let requestId = requestFile + '#' + requestName;
            this.logger.info('Plying: ' + requestId);
            let baseName = this.getBaseName(requestFile);
            const testCase = new Case(baseName, this.options);
            if (this.emitter) {
              this.emitter.emit('start', {
                type: 'start',
                id: requestId
              });
            }
            testCase.run(request, this.values, requestName)
            .then(response => {
              testCase.verifyAsync(this.values, requestName)
              .then(result => {
                if (this.emitter) {
                  this.emitter.emit('outcome', {
                    type: 'outcome',
                    id: requestId,
                    request: request,
                    response: response,
                    result: result
                  });
                }
                resolve(result.status === 'Passed');
              })
              .catch(err => {
                if (this.emitter) {
                  this.emitter.emit('outcome', {
                    type: 'outcome',
                    id: requestId,
                    request: request,
                    response: response,
                    error: err
                  });
                }
              });
            })
            .catch(err => {
              if (this.emitter) {
                this.emitter.emit('outcome', {
                  type: 'outcome',
                  id: requestId,
                  request: request,
                  error: err
                });
              }
            });
          }
          else {
            throw new Error('Request not found: ' + requestFile + '#' + requestName);
          }
        }
        else {
          // all requests are run sequentially
          let caseName = this.getBaseName(requestFile);
          let success = true;
          Object.keys(requests).reduce((promise, name) => {
            return promise.then(() => {
              return new Promise(res => {
                if (this.options.bail && !success) {
                  res();
                }
                else {
                  let request = requests[name];
                  let testCase = new Case(caseName, this.options);
                  let requestId = requestFile + '#' + name;
                  this.logger.info('\nPlying: ' + requestId);
                  if (this.emitter) {
                    this.emitter.emit('start', {
                      type: 'start',
                      id: requestId
                    });
                  }
                  testCase.run(request, this.values, name)
                  .then(response => {
                    testCase.verifyAsync(this.values, name)
                    .then(result => {
                      if (result.status !== 'Passed') {
                        success = false;
                      }
                      if (this.emitter) {
                        this.emitter.emit('outcome', {
                          type: 'outcome',
                          id: requestId,
                          request: request,
                          response: response,
                          result: result
                        });
                      }
                      res();
                    })
                    .catch(err => {
                      success = false;
                      if (this.emitter) {
                        this.emitter.emit('outcome', {
                          type: 'outcome',
                          id: requestId,
                          request: request,
                          response: response,
                          error: err
                        });
                      }
                    });
                  })
                  .catch(err => {
                    if (this.emitter) {
                      this.emitter.emit('outcome', {
                        type: 'outcome',
                        id: requestId,
                        request: request,
                        error: err
                      });
                    }
                  });
                }
              });
            });
          }, Promise.resolve())
          .then(() => {
            resolve(success);
          });
        }
      });
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

