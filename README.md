#Ply

## REST API Automated Testing

## Install
```bash
npm install --save ply-ct
```

## Usage
Path-Style Locations:
 - If using Node, point to file system directories. 
 - If in browser, point to local storage paths.
 
URL-Style Locations:
(For options.location, options.expectedResultLocation)
 - Point to GitHub repository relative location.
 
## Example:
```javascript
const limberest = require('../lib/limberest');

// Note testsLoc on file system allows synchronous reads.
const testsLoc = '../../limberest-demo/test';
var values = limberest.loadValuesSync(testsLoc + '/limberest.io.values');
var group = limberest.loadGroupSync(testsLoc + '/movies-api.postman');

var request = group.getRequest('GET', 'movies?{query}');

values = Object.assign({}, values, {query: 'year=1935&rating=5'});

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
```

## Full Documentation:
  - https://ply-ct.com/topics/requests