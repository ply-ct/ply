'use strict';

const ply = require('../src/ply');

// testsLoc on file system allows synchronous reads
const testsLoc = '../../ply-demo/src/test/ply';
var requests = ply.loadRequests(testsLoc + '/requests/movies-api.postman_collection.json');
var request = requests['Movies Query'];

var values = Object.assign({}, ply.loadValues(testsLoc + '/values/ply-ct.com.postman_environment.json'));
values.query = 'year=1935&rating=5';

var options = {
  location: testsLoc,
  expectedResultLocation: testsLoc + '/results/expected',
  resultLocation: testsLoc + '/results/actual',
  debug: true,
  responseHeaders: ['content-type']
};
    
request.run(options, values)
.then(response => {
  request.verify(values);
})
.catch(err => {
  console.log(err);
});