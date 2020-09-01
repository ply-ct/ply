---
layout: topic
---
## Requests
Ply is all about automated testing of REST and GraphQL APIs. By running Ply tests, 
you're sending actual HTTP requests to exercise your service endpoints.

Requests are the reusable building blocks you arrange to create test sequences, or suites.
Each request represents an HTTP request with these elements:
  - url
  - method
  - headers
  - body

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
  url:  '${baseUrl}/${@moviesByYearAndRating.response.body.movies[0].id}'
  method: GET
  headers:
    Accept: application/json
```
Here we use special designator `@` in our URL expression to reference a runtime value from the body of the previous response.
This enables us to construct simple workflows by embedding values from previous requests/responses in subsequent requests.

Before we move on to show how you can run your Ply request suites, a few points to keep in mind:
  - Suites are identified by their YAML file name, so there's always one suite per file
  - Suites should be self contained; expressions cannot reference runtime values from a different suite
  - During execution:
    - suites are run in parallel 
    - but within a suite each request is run sequentially, in order

## Executing
Requests can be run via [Ply CLI](cli), or within Visual Studio Code by installing the [Ply Extension]().

For now let's use the CLI to run ply-demo's movie-queries.ply.yaml request suite. First, if you haven't already,
[install Ply](install-ply). Then clone ply-demo and run the request suite:
```
git clone https://github.com/ply-ct/ply-demo.git
cd ply-demo
npm install
npm run start-movies
ply test/requests/movie-queries.ply.yaml
npm run stop-movies
```
The output indicates that all tests passed:
```
Request 'moviesByYearAndRating' submitted at 8/29/2020, 18:26:54:981
Test 'moviesByYearAndRating' PASSED in 51 ms
Request 'movieById' submitted at 8/29/2020, 18:26:55:031
Test 'movieById' PASSED in 8 ms
Request 'moviesQuery' submitted at 8/29/2020, 18:26:55:039
Test 'moviesQuery' PASSED in 8 ms

Overall Results: {"Passed":3,"Failed":0,"Errored":0,"Pending":0,"Not Verified":0}
Overall Time: 305 ms
```
To understand what it means for a request to have PASSED, continue on to [Results](results).

**Note:** Like many of these exercises, movie-queries.ply.yaml uses the [ply-movies](install-ply#ply-movies) sample API.
Therefore the above commands include steps for starting and stopping the ply-movies server. Henceforward these steps will be omitted.
You can start ply-movies once, and stop it whenever you're done running these examples.

### Run a single request
Passing a file name to `ply` executes all requests in sequence. You can also run an individual request by itself:
```
ply test/requests/movie-queries.ply.yaml#moviesByYearAndRating
```

### Run without verifying
You can tell Ply to submit *ad hoc* requests without verifying results (see [CLI commands](cli#command-line-only-arguments)):
```
ply -x test/requests/movie-queries.ply.yaml
```

## GraphQL
In request YAML, `body` elements may contain any text content. For REST APIs like ply-movies, this is typically JSON.
But GraphQL syntax is also supported, as in the following example which queries the [GitHub GraphQL API](https://docs.github.com/en/graphql) 
for ply-demo repository topics: 
```yaml
repositoryTopicsQuery:
  url: 'https://api.github.com/graphql'
  method: POST
  headers:
    Authorization: Bearer ${githubToken}
    Content-Type: application/json
    User-Agent: ${github.organization}
  body: |-
    query {
      repository(owner: "${github.organization}", name: "${github.repository}") {
        repositoryTopics(first: 10) {
          edges {
            node {
              topic {
                name
              }
            }
          }
        }
      }
    }
```

To run this in ply-demo:
```
ply test/requests/github-api.ply.yaml#repositoryTopicsQuery
```
You'll receive an HTTP 401 (Unauthorized) response unless you include the `githubToken` property
somewhere in your [values](values) JSON. This is a good candidate for the [PLY_VALUES](values#environment-variable) 
environment variable, since you wouldn't want to share `githubToken` in version control.

Next Topic: [Results](results)