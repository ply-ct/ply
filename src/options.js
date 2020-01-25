'use strict';

const defaults = require('defaults');

// everything is forward slashes
var Options = function(options) {
  this.options = defaults(options, Options.defaultOptions);
  options.location = options.location.replace(/\\/g, '/');
  if (!options.resultLocation) {
    options.resultLocation = options.location + '/results/actual';
  }
  options.resultLocation = options.resultLocation.replace(/\\/g, '/');
  if (!options.expectedResultLocation) {
    options.expectedResultLocation = options.location + '/results/expected';
  }
  options.expectedResultLocation = options.expectedResultLocation.replace(/\\/g, '/');
  if (!options.logLocation) {
    options.logLocation = options.resultLocation;
  }
  options.logLocation = options.logLocation.replace(/\\/g, '/');
  if (this.options.expectedResultLocation.startsWith('https://github.com/')) {
    this.options.expectedResultLocation = 'https://raw.githubusercontent.com/'
        + this.options.expectedResultLocation.substring(19);
  }
};

Options.prototype.get = function(name) {
  return this.options[name];
};

Options.defaultOptions = {
  debug: false,
  bail: false,
  location: process.cwd(),
  // expectedResultLocation: this.location + '/results/expected',
  // resultLocation: this.location + '/results/actual',
  // logLocation: path.dirname(process.argv[1]) + '/results/actual',
  // localLocation: (indicates local override possible)
  extensions: ['.ply.yaml','.postman_collection.json'],
  // responseHeaders: (array of validated response headers, in the order they'll appear in result yaml)
  formatResult: true,
  prettyIndent: 2,
  retainLog: false,  // accumulate for multiple runs
  captureResult: true,
  retainResult: false,
  qualifyLocations: false, // actual result and log paths prefixed by group (or can be string for custom)
  storageSuffix: false, // actual result and log storage name suffixed with test run name (string for custom)
  overwriteExpected: false
};

exports.Options = Options;