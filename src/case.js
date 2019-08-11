'use strict';

const path = require('path');
const yaml = require('./yaml');
const Options = require('./options').Options;
const Logger = require('./logger').Logger;
const run = require('./run');
const compare = require('./compare');
const subst = require('./subst');
const Storage = require('./storage').Storage;
const Retrieval = require('./retrieval').Retrieval;

var Case = exports.Case = function(name, options) {
  if (typeof name === 'object') {
    options = name;
    name = path.basename(process.argv[1], path.extname(process.argv[1]));
  }
  this.name = name;
  this.options = new Options(options).options;

  if (this.options.resultLocation.startsWith('https://') ||
      this.options.resultLocation.startsWith('http://')) {
    throw new Error('Unsupported result location: ' + this.options.resultLocation);
  }
};

Case.prototype.init = function(qualifier, suffix) {
  var expectedLoc = this.options.expectedResultLocation;
  this.expectedResultRetrieval = new Retrieval(expectedLoc, this.name + '.yaml');

  var actualLoc = this.options.resultLocation;
  if (qualifier)
    actualLoc += '/' + qualifier;
  var storageName = this.name;
  if (suffix)
    storageName += '#' + suffix;
  this.actualResultStorage = new Storage(actualLoc, storageName + '.yaml');
  if (!this.options.retainResult) {
    this.actualResultStorage.remove();
    if (this.options.overwriteExpected) {
      if (this.expectedResultRetrieval.storage)
        this.expectedResultRetrieval.storage.remove();
      else
        throw new Error('Overwrite not supported for expectedResultLocation: ' + this.options.expectedResultLocation);
    }
  }

  var logLoc = this.options.logLocation;
  if (qualifier)
    logLoc += '/' + qualifier;
  var logName = this.name;
  if (suffix)
    logName += '#' + suffix;
  this.logger = new Logger({
    level: this.options.debug ? 'debug' : 'info',
    location: logLoc,
    name: logName + '.log',
    retain: this.options.retainLog
  });

  this.inited = true;
};

Case.prototype.run = function(test, values, name) {
  if (!this.inited) {
    var qualifier = undefined;
    if (this.options.qualifyLocations) {
      if (typeof this.options.qualifyLocations === 'string')
        qualifier = this.options.qualifyLocations;
      else
        qualifier = test.group;
    }
    var suffix = undefined;
    if (this.options.storageSuffix) {
      if (typeof this.options.storageSuffix === 'string')
        suffix = this.options.storageSuffix;
      else
        suffix = name;
    }
    this.init(qualifier, suffix);
  }

  this.result = null;
  const testRun = run.create(name ? name : this.name);
  if (qualifier)
    this.logger.info(test.group + '/' + testRun.test + ' @' + new Date());
  else
    this.logger.info(this.name + '#' + testRun.test + ' @' + new Date());

  if (values)
    this.logger.debug('Values: ' + this.jsonString(values));

  var req = test.getRequest(values);
  if (this.authHeader) {
    if (!req.headers) {
      req.headers = {};
    }
    if (!req.headers.Authorization) {
      req.headers.Authorization = this.authHeader;
    }
  }
  this.logger.debug('Request: ' + this.jsonString(req));

  const testCase = this;
  return new Promise(function(resolve, reject) {
    testRun.execute(req)
    .then(resp => {
      try {
        if (resp)
          testCase.logger.debug('Response: ' + testCase.jsonString(resp));

        if (testCase.options.captureResult) {

          if (req) {
            // remove Authorization header
            if (req.headers && req.headers.Authorization) {
              delete req.headers.Authorization;
            }
          }

          var allHeaders;
          var time;
          if (resp) {
            allHeaders = resp.headers;
            // clear unwanted headers
            if (testCase.options.responseHeaders && resp.headers) {
              var wanted = testCase.options.responseHeaders; // array
              var respHeaders = {};
              var headerKeys = Object.keys(resp.headers).sort((keyOne, keyTwo) => {
                return wanted.indexOf(keyOne) - wanted.indexOf(keyTwo);
              });
              headerKeys.forEach(hdrKey => {
                if (wanted.find(wantedKey => wantedKey.toLowerCase() == hdrKey.toLowerCase())) {
                  respHeaders[hdrKey] = resp.headers[hdrKey];
                }
              });
              resp.headers = respHeaders;
            }
            // remove time by default
            time = resp.time;
            if (!testCase.options.responseTime)
              delete resp.time;
          }

          // save yaml results
          var actualYaml = testCase.yamlString(testCase.options.formatResult ? testRun.format(testCase.options.prettyIndent) : testRun.raw());
          testCase.actualResultStorage.append(actualYaml);
          if (testCase.options.overwriteExpected) {
            testCase.logger.info('Writing expected result: ' + testCase.expectedResultRetrieval.storage);
            testCase.expectedResultRetrieval.storage.append(actualYaml);
          }

          if (resp) {
            // restore for programmatic access
            resp.headers = allHeaders;
            resp.time = time;
          }
        }

        resolve(resp);
      }
      catch (err) {
        testCase.handleError(err);
        reject(err);
      }
    })
    .catch(err => {
      testCase.handleError(err);
      reject(err);
    });
  });
};

// name is subelement within expected result storage
Case.prototype.verifyAsync = function(values, name) {
  var thisCase = this;
  return new Promise(function(resolve, reject) {
    if (thisCase.error) {
      thisCase.handleError(this.error);
      reject(thisCase.error);
    }
    else {
      try {
        thisCase.expectedResultRetrieval.loadAsync(function(err, data) {
          var result;
          if (data) {
            if (name) {
              const obj = yaml.load(thisCase.expectedResultRetrieval.toString(), data);
              const expectedObj = obj[name];
              if (!expectedObj)
                reject(new Error('Expected result not found: ' + thisCase.expectedResultRetrieval + '#' + name));
              const yamlObj = {};
              yamlObj[name] = expectedObj;
              const expected = thisCase.yamlString(yamlObj);
              result = thisCase.verifyResult(expected, values);
              // line number in expected result storage
              result.lineNumber = expectedObj.line + 1;
            }
            else {
              result = thisCase.verifyResult(data, values);
            }
            resolve(result);
          }
          else {
            reject(new Error("Expected result not found: " + thisCase.expectedResultRetrieval));
          }
        });
      }
      catch (err) {
        thisCase.handleError(err);
        reject(err);
      }
    }
  });
};

// name is subelement within expected result storage
Case.prototype.verify = function(values, name) {
  if (this.error) {
    this.handleError(this.error);
    return;
  }
  try {
    var expected = this.expectedResultRetrieval.load();
    if (!expected) {
      throw new Error('Expected result not found: ' + this.expectedResultRetrieval);
    }
    if (name) {
      const obj = yaml.load(this.expectedResultRetrieval.toString(), expected);
      const expectedObj = obj[name];
      if (!expectedObj)
        throw new Error('Expected result not found: ' + this.expectedResultRetrieval + '#' + name);
      const yamlObj = {};
      yamlObj[name] = expectedObj;
      expected = this.yamlString(yamlObj);
      let result = this.verifyResult(expected, values);
      // line number in expected result storage
      result.lineNumber = expectedObj.line + 1;
      return result;
    }
    else {
      return this.verifyResult(expected, values);
    }
  }
  catch (err) {
    this.handleError(err);
  }
};

// verify with preloaded result
Case.prototype.verifyResult = function(expected, values) {
  var expectedYaml = subst.trimComments(expected.replace(/\r/g, ''));
  if (!this.actualResultStorage.exists())
    throw new Error('Actual result not found: ' + this.actualResultStorage);
  this.logger.debug('Comparing: ' + this.expectedResultRetrieval + '\n  with: ' + this.actualResultStorage);
  var actual = this.actualResultStorage.read();
  var actualYaml = subst.trimComments(actual);
  var diffs = compare.diffLines(subst.extractCode(expectedYaml), subst.extractCode(actualYaml), values, {
    newlineIsToken: false,
    ignoreWhitespace: false
  });
  var firstDiffLine = 0;
  var diffMsg = '';
  if (diffs) {
    let line = 1;
    let actLine = 1;
    for (let i = 0; i < diffs.length; i++) {
      var diff = diffs[i];
      if (diff.removed) {
        var correspondingAdd = (i < diffs.length - 1 && diffs[i + 1].added) ? diffs[i + 1] : null;
        if (!diff.ignored) {
          if (!firstDiffLine)
            firstDiffLine = line;
          diffMsg += line;
          if (diff.count > 1)
            diffMsg += '-' + (line + diff.count - 1);
          diffMsg += '\n';
          diffMsg += subst.prefix(diff.value, '- ', expectedYaml, line - 1);
          if (correspondingAdd) {
            diffMsg += subst.prefix(correspondingAdd.value, '+ ', actualYaml, actLine - 1);
          }
          diffMsg += '===\n';
        }
        line += diff.count;
        if (correspondingAdd) {
          i++; // corresponding add already covered
          actLine += correspondingAdd.count;
        }
      }
      else if (diff.added) {
        if (!diff.ignored) {
          // added with no corresponding remove
          if (!firstDiffLine)
            firstDiffLine = line;
          diffMsg += line + '\n';
          diffMsg += subst.prefix(diff.value, '+ ', actualYaml, actLine - 1);
          diffMsg += '===\n';
        }
        actLine += diff.count;
      }
      else {
        line += diff.count;
        actLine += diff.count;
      }
    }
  }
  var result;
  if (firstDiffLine) {
    this.logger.error('Case "' + this.name + '" FAILED: Results differ from line ' + firstDiffLine + ':\n' + diffMsg);
    result = {status: 'Failed', message: 'Results differ from line ' + firstDiffLine};
  }
  else {
    this.logger.info('Case "' + this.name + '" PASSED');
    result = {status: 'Passed', message: 'Test succeeded'};
  }
  this.logger.debug('Result: ' + this.jsonString(result));
  return result;
};

Case.prototype.handleError = function(error) {
  this.error = error;
  if (error.stack) {
    this.logger.error(error.stack);
  }
  else {
    this.logger.error(error);
  }
  this.result = {
      status: 'Errored',
      message: error.toString()
  };
};

Case.prototype.jsonString = function(obj) {
  return JSON.stringify(obj, null, this.options.prettyIndent);
};

Case.prototype.yamlString = function(obj) {
  let noLines = {};
  Object.keys(obj).forEach(key => {
    let {line, ...withoutLine} = obj[key]; // eslint-disable-line no-unused-vars
    noLines[key] = withoutLine;
  });
  return yaml.dump(noLines);
};
