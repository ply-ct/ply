---
layout: topic
---
## Cases
Tests based on single requests can be fragile. What if we were to run GET right after DELETE?  We'd likely get an HTTP 404 response,
which would disagree with the expected result. Real-world APIs need an orchestration approach, and that's what Ply cases deliver.
Cases use JavaScript to string together multiple requests. They can include conditionality and populate values programmatically, and they
can easily parse JSON response content. This gives you the power to build tests as complex as the API you're exercising.

## ply-movies
Most of these exercises use the [ply-movies](https://github.com/ply-ct/ply-movies#readme) sample API.
You need to run locally for POST/PATCH/PUT/DELETE requests used by these cases.
Once you've cloned [ply-demo](https://github.com/ply-ct/ply-demo), you can easily host ply-movies locally.
Here's how to start/stop ply-movies server as a background process through npm scripts:
```
npm run start-movies
# <run some tests>
npm run stop-movies
```
You could also choose to install ply-movies globally, and start the server in a separate command window:
```
npm install -g ply-movies
ply-movies start
```
In that case you'd shut it down using `ctrl-c` once you're done testing.


Take a look at this snippet from the ply-demo [movie-crud.js](https://github.com/ply-ct/ply-demo/blob/master/src/test/ply/cases/movie-crud.js)
test case:
```javascript
const ply = require('ply-ct');
const demo = require('../lib/ply-demo');
...

const collection = ply.loadCollection(options.location + '/movies-api.postman');

demo.cleanupMovie(collection, values)
.then(() => {
  logger.info('Cleanup completed for movie: ' + values.id);
  var post = collection.getRequest('POST', 'movies');
  return testCase.run(post, values);
})
.then(response => {
  // update it (with programmatically-set rating)
  values.rating = 4.5;
  var put = collection.getRequest('PUT', 'movies/{id}');
  return testCase.run(put, values);
})
.then(response => {
  // confirm update
  var get = collection.getRequest('GET', 'movies/{id}');
  return testCase.run(get, values);
})
.then(response => {
  // delete it
  var del = collection.getRequest('DELETE', 'movies/{id}');
  return testCase.run(del, values);
})
.then(response => {
  // confirm delete
  var get = collection.getRequest('GET', 'movies/{id}');
  return testCase.run(get, values);
})
.then(response => {
  // load results
  return ply.loadFile(options, 'results/expected/movies-api/movie-crud.yaml');
})
.then(expectedResult => {
  var res = testCase.verifyResult(expectedResult, values);
...
```
This illustrates a number of concepts:
  0. You can leverage helper functions and third-party [Node.js](https://nodejs.org/en/) modules through `require()` syntax.
     In fact, while building cases it's very convenient to run them from the command-line:
     ```
     node movie-crud
     ```
  0. You can perform preliminary cleanup. The demo.cleanupMovie() function invokes a DELETE and doesn't care whether
     the response comes back with HTTP 200 or 404. We start our case execution with a clean slate.
  0. You can employ asynchronicity, which is a natural paradigm for request/response processing in JavaScript.
     Ply helper functions like `testCase.run()` use JavaScript's concise and intuitive
     [Promise syntax](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Using_promises) syntax
     with [ES6 arrow functions](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Functions/Arrow_functions)
     to postpone execution until the response from the previous operation is received.
  0. You can programmatically override or supplement values, as we've done before our PUT by assigning `values.rating = 4.5`.
     The updated values are substituted in the request and also passed to testCase.verify() so they'll be used
     when evaluating the expected vs. actual result YAML. This gives you the flexibility to pull values from
     an API response and use them to populate subsequent requests.
     
When invoked from the command-line, Ply stores results and logs on the file system and performs comparisons from there:
```
node movie-crud
...
...
Comparing: ../results/expected/movies-api/movie-crud.yaml
  with: ../results/actual/movies-api/movie-crud.yaml
Case "movie-crud" PASSED
Result: {
  "status": "Passed",
  "message": "Test succeeded"
}
```
If you clone the [ply-demo](https://github.com/ply-ct/ply-demo) project, you can run the command 
above from the test/cases/ directory.

In fact, the [ply-ct](https://www.npmjs.com/package/ply-ct) node module has all kinds of capabilities for
complete API test automation, with or without Ply UI.

Next Topic: [Postman](postman)
