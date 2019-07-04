'use strict';

const ply = require('../src/ply');

const testsLoc = '../../ply-demo/src/test/ply';
var requests = ply.loadRequests(testsLoc + '/movie-queries.request.yaml');
var request = requests.movieById;
var values = Object.assign({}, ply.loadValuesAsync(testsLoc + '/global.values'), 
      ply.loadValuesAsync(testsLoc + '/ply-ct.com.values'));

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