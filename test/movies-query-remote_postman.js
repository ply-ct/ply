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
  request = requests['Movies Query'];
  return ply.loadValues(testsLoc + '/values/ply-ct.com.postman_environment.json');
})
.then(vals => {
  values = vals;
  values.query = 'year=1935&rating=5';
  return request.run(options, values);
})
.then(response => {
  request.verifyAsync(values);
})
.catch(err => {
  console.log(err);
});


