'use strict';

const ply = require('../src/ply');

// testsLoc on file system allows synchronous reads
const testsLoc = '../../ply-demo/src/test/ply';
var requests = ply.loadRequests(testsLoc + '/requests/movie-queries.request.yaml');
var request = requests.movieById;
var values = Object.assign({}, ply.loadValues(testsLoc + '/values/main.values.json'), 
      ply.loadValues(testsLoc + '/values/ply-ct.com.values.json'));

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
  console.log(err.message);
});