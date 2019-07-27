'use strict';

const path = require('path');
const defaults = require('defaults');

var Options = function(options) {
  this.options = defaults(options, Options.defaultOptions);
  if (!options.resultLocation) {
    options.resultLocation = options.location + '/results/actual';
  }
  if (!options.expectedResultLocation) {
    options.expectedResultLocation = options.location + '/results/expected';
  }
  if (!options.logLocation) {
    options.logLocation = options.resultLocation;
  }
  if (this.options.expectedResultLocation.startsWith('https://github.com/')) {
    this.options.expectedResultLocation = 'https://raw.githubusercontent.com/'
        + this.options.expectedResultLocation.substring(19);
  }
};

Options.prototype.get = function(name) {
  return this.options[name];
};

Options.defaultOptions = {
  location: process.cwd(),
  // extensions: (eg: ['.request.yaml']
  // expectedResultLocation: this.location + '/results/expected',
  // resultLocation: this.location + '/results/actual',
  // logLocation: path.dirname(process.argv[1]) + '/results/actual',
  // localLocation: (indicates local override possible)
  debug: false,
  retainLog: false,  // accumulate for multiple runs
  captureResult: true,
  retainResult: false,
  formatResult: true,
  prettyIndent: 2,
  qualifyLocations: true, // result and log paths prefixed by group (or can be string for custom)
  overwriteExpected: false,
  // responseHeaders: (array of validated response headers, in the order they'll appear in result yaml)
  sortResponseKeys: true
};

exports.Options = Options;