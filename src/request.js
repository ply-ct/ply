'use strict';

const Case = require('./case').Case;
const subst = require('./subst');
const Retrieval = require('./retrieval').Retrieval;
const Storage = require('./storage').Storage;

const proto = {
  // TODO .yaml extension is hardcoded
  init: function(options) {
    var qualifier = undefined;
    if (options.qualifyLocations) {
      if (typeof options.qualifyLocations === 'string')
        qualifier = options.qualifyLocations;
      else
        qualifier = this.group;
    }
    var suffix = undefined;
    if (options.storageSuffix) {
      if (typeof options.storageSuffix === 'string')
        suffix = options.storageSuffix;
      else
        suffix = this.name;
    }
    var expectedLoc = options.expectedResultLocation;
    if (qualifier)
      expectedLoc += '/' + qualifier;
    this.expected = new Retrieval(expectedLoc, this.group + '.yaml');

    var actualLoc = options.resultLocation;
    if (qualifier)
      actualLoc += '/' + qualifier;
    var storageName = this.group;
    if (suffix)
      storageName += '#' + suffix;
    this.actual = new Storage(actualLoc, storageName + '.yaml');
  },
  run(options, values, name) {
    var caseName = options.caseName;
    if (!caseName) {
      caseName = this.group;
    }
    if (!name) {
      name = this.name;
    }
    this.implicitCase = new Case(caseName, options);
    return this.implicitCase.run(this, values, name);
  },
  verify: function(values) {
    this.result = this.implicitCase.verify(values, this.name);
    return this.result;
  },
  verifyAsync: function(values) {
    var request = this;
    return new Promise(function(resolve, reject) {
      request.implicitCase.verifyAsync(values, this.name)
      .then(result => {
        request.result = result;
        resolve(result);
      })
      .catch(err => {
        reject(err);
      });
    });
  },
  verifyResult: function(expected, values) {
    this.result = this.implicitCase.verifyResult(expected, values);
    return this.result;
  },
  getRequest(values) {
    const req = {
      url: subst.replace(this.url, values),
      method: this.method
    };
    if (this.headers) {
      req.headers = {};
      Object.keys(this.headers).forEach(key => {
        req.headers[key] = subst.replace(this.headers[key], values);
      });
    }
    if (this.body) {
      req.body = subst.replace(this.body, values);
    }
    return req;
  },
  json(body) {
    if (arguments.length === 1) {
      // set mode
      if (!body) {
        delete this.body;
      }
      else {
        this.body = JSON.stringify(body, null, 2);
      }
    }
    else {
      // get mode
      if (this.body) {
        return JSON.parse(this.body);
      }
    }
  },
};

module.exports = {
  create: (group, from) => Object.assign({group: group}, proto, from)
};