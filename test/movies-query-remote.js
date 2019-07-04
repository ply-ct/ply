'use strict';

const ply = require('../src/ply');

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

ply.loadGroup(testsLoc + '/movies-api.postman')
.then(group => {
  request = group.getRequest('GET', 'Movies Query');
  return ply.loadValues(options, ['/ply-ct.com.values']);
})
.then(vals => {
  values = vals;
  values.query = 'year=1935&rating=5';
  return request.run(options, values);
})
.then(response => {
  request.verify(values);
})
.catch(err => {
  console.log(err);
});


