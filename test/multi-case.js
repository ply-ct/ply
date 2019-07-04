'use strict';

const ply = require('../src/ply');
const Multirun = require('../src/multirun');

const testsLoc = 'https://raw.githubusercontent.com/ply-ct/ply-demo/master/src/test/ply';

const options = {
  location: testsLoc,
  expectedResultLocation: testsLoc + '/results/expected',
  resultLocation: '../../ply-demo/src/test/ply/results/actual',
  debug: true,
  responseHeaders: ['content-type']
};
  
var requests;
var values;

ply.loadGroup(testsLoc + '/movies-api.postman')
.then(group => {
  request = group.getRequest();
  return ply.loadValues(options, ['/ply.io.values']);
})
.then(values => {
  new Multirun().runCases();
})
