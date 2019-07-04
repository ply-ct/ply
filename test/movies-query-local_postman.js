'use strict';

const ply = require('../src/ply');

// testsLoc on file system allows synchronous reads
const testsLoc = '../../ply-demo/src/test/ply';
var collection = ply.loadCollection(testsLoc + '/movies-api.postman');
var request = collection.getRequest('GET', 'Movies Query');

var values = Object.assign({}, ply.loadValues(testsLoc + '/ply-ct.com.values'));
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