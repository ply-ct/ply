'use strict';

const ply = require('../src/ply');

// loading from GitHub
const testsLoc = 'https://raw.githubusercontent.com/ply-ct/ply-demo/master/src/test/ply';

const options = {
  location: testsLoc,
  expectedResultLocation: testsLoc + '/results/expected',
  resultLocation: '../../ply-demo/src/test/ply/results/actual',
  debug: true,
  responseHeaders: ['content-type']
};
  
var request;
var values;

// loadRequests() returns a promise when loading from URL
ply.loadRequests(testsLoc + '/requests/movies-api.postman_collection.json')
.then(requests => {
  console.log('REQUESTS: ' + JSON.stringify(requests, null, 2));
});