'use strict';

const ply = require('../src/ply');

// Note testsLoc on file system allows synchronous reads.
const testsLoc = '../../ply-demo/src/test/ply';
var group = ply.loadGroupSync(testsLoc + '/movies-api.postman');
var request = group.getRequest('GET', 'Movie by ID');
var values = Object.assign({}, ply.loadValuesSync(testsLoc + '/global.values'), 
      ply.loadValuesSync(testsLoc + '/ply-ct.com.values'));

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