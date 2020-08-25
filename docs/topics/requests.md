---
layout: topic
---
## Requests
Ply is all about automated testing of REST and GraphQL APIs. When executing a test, 
you'll send actual HTTP requests to exercise your service endpoints.

Requests are the reusable building blocks you'll arrange to create test sequences, or suites.
Each request represents an HTTP request with parameterized URL, method, headers and body.
A request suite is a YAML file containing one or more named requests.  Here's an example from 
movie-queries.ply.yaml in the [ply-demo](https://github.com/ply-ct/ply-demo) project:
```yaml
moviesByYearAndRating:
  url: '${baseUrl}?year=${year}&rating=${rating}'
  method: GET
  headers:
    Accept: application/json
```
This defines a GET request against [ply-movies](https://github.com/ply-ct/ply-movies/), an
example API we use to illustrate Ply testing.  Our request's name, `moviesByYearAndRating`,
is the top-level key. Note our use of JavaScript [template literal](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Template_literals)
expressions embedded in `url`. Every element of a request can be parameterized using [Values](values).

The next request in this suite illustrates another important feature of expressions:
```yaml
movieById:
  # id comes from previous response body
  url:  '${baseUrl}/${@moviesByYearAndRating.response.body.movies[1].id}'
  method: GET
  headers:
    Accept: application/json
```
Here we use special designator `@` in our URL expression to reference a runtime value from the body of the previous response.
This enables us to construct simple workflows by embedding values from previous requests/responses in subsequent requests.
Ply also supports another special designator `~` that lets you embed regular expressions (more on this in [Results](results)).

Before we move on to show how you can run your Ply request suites, a few points to keep in mind:
  - Suites are identified by their YAML file name, so there's always one suite per file
  - Suites should be self contained; expressions cannot reference runtime values from a different suite
  - During execution:
    - suites are run in parallel 
    - but within a suite each request is run sequentially, in order

## Executing
Requests can be run via the [CLI](cli), or within Visual Studio Code by installing the [Ply Extension]().

For now let's use the CLI to run ply-demo's movie-queries.ply.yaml request suite.  Clone ply-demo and run the request suite:
```
git clone https://github.com/ply-ct/ply-demo.git
cd ply-demo
npm install
npm run ply -- test/requests/movie-queries.ply.yaml
```
In package.json the scripts 'preply' and 'postply' start and stop ply-movies to handle movie-queries REST requests.
The output indicates that all tests passed:
```
Request 'moviesByYearAndRating' submitted at 8/12/2020, 16:54:53:048
Test 'moviesByYearAndRating' PASSED
Request 'movieById' submitted at 8/12/2020, 16:54:53:100
Test 'movieById' PASSED
Request 'moviesQuery' submitted at 8/12/2020, 16:54:53:107
Test 'moviesQuery' PASSED

Overall Results: {"Passed":3,"Failed":0,"Errored":0,"Pending":0,"Not Verified":0}
```
To understand what it means for a request to have PASSED, continue on to [Results](results).

## GraphQL
TODO

Next Topic: [Results](results)