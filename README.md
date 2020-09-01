# Ply
![GitHub Workflow Status](https://img.shields.io/github/workflow/status/ply-ct/ply/ply%20ci)

<h2>API Automated Testing
<div><img src="https://raw.githubusercontent.com/ply-ct/ply/master/docs/img/wares.png" width="128" alt="Ply your wares" /></div>
</h2>

  - [Installation](#installation)
  - [Usage](#usage)
  - [Documentation](#documentation)
  - [Demo](#demo)
  - [VS Code Extension](#vs-code-extension)

## Installation
```
npm install ply-ct --save-dev
```
Or, to run anywhere:
```
npm install -g ply-ct
```

## Usage
Ply API testing starts with a YAML file containing requests. Here's a GET request to retrieve
topics for the [ply-demo](https://github.com/ply-ct/ply-demo) repository using
[GitHub API](https://developer.github.com/v3/repos/#get-all-repository-topics) v3:
```yaml
repositoryTopics:
  url: 'https://api.github.com/repos/ply-ct/ply-demo/topics'
  method: GET
  headers:
    Accept: application/vnd.github.mercy-preview+json
```

### Run a request
Suppose you save this in a file named "github.ply.yml". Then you can submit this
`repositoryTopics` request from the command line by typing:
```
ply -x github.ply.yml
```
The `-x` argument tells Ply not to verify the response (`-x` is short for `--exercise`, 
meaning submit an *ad hoc* request and don't bother with verification).

### Verify response
If you run without `-x` you'll get an error saying, "Expected result file not found". Ply verification
works by comparing expected vs actual. So a complete test requires an expected result file. Run again
with `--create`, and the expected result file will be created from the actual response.
```
ply --create github.ply.yml
```
Output looks like this:
```
Request 'repositoryTopics' submitted at 8/28/2020, 10:54:40:667
Creating expected result: ./results/expected/github.yml
Test 'repositoryTopics' PASSED in 303 ms
```
During execution Ply submits the request and writes **actual** result file "./results/actual/github.yml"
based on the response. Because of `--create`, Ply then copies the actual result over **expected** result file "./results/expected/github.yml"
before comparing. This test naturally passes since the results are identical.

### Expected results
Auto-creating an expected result provides a good starting point. But looking at "./results/expected/github.yml",
you'll notice that it includes many response headers that are not of interest for testing purposes. Here's a
cleaned-up version of similar expected results from [ply-demo](https://github.com/ply-ct/ply-demo/blob/master/test/requests/github-api.ply.yaml#L1):
```yaml
repositoryTopics:
  request:
    url: 'https://api.github.com/repos/${github.organization}/${github.repository}/topics'
    method: GET
    headers:
      Accept: application/vnd.github.mercy-preview+json
  response:
    status:
      code: 200
      message: OK
    headers:
      content-type: application/json; charset=utf-8
      status: 200 OK
    body: |-
      {
        "names": [
          "rest-api",
          "testing",
          "ply",
          "example-project",
          "graphql",
          "typescript",
          "github-workflow"
        ]
      }
```
The subset of response headers included in expected results YAML are those we care about for comparison.
In this test, body content is our main concern.

### Expressions
Something else about this example may be noticed by sharp-eyed observers: our request URL contains
placeholders like `${github.organization}`. Ply supports JavaScript [template literal](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Template_literals)
syntax for substituting dynamic values in both requests and results. Values come from JSON files and/or environment variables,
as described in the docs under [Values](https://ply-ct.github.io/ply/topics/values).

Even more powerfully, your multi-request suites can embed expressions that reference runtime values from previous responses.
For instance, the URL or body of a subsequent request in our github.ply.yml file could have something like this:
```
${@repositoryTopics.response.body.names[0]
```
which uses the special `@` character to reference the first topic name from above (resolving to 'rest-api').
This enables you to string together sequential requests that each depend on response output from preceding ones.
Check out the [Results](https://ply-ct.github.io/ply/topics/results) topic for details and examples.

### Cases
For complex testing scenarios, you'll want even greater control over request execution.
Implement a Ply [case](https://ply-ct.github.io/ply/topics/cases) suite using TypeScript for programmatic
access to your requests/responses. Here's [add new movie](https://github.com/ply-ct/ply-demo/blob/master/test/cases/movieCrud.ply.ts#L31) 
from ply-demo:
```typescript
@test('add new movie')
async createMovie(values: any) {
    const result = await this.requestSuite.run('createMovie', values);
    assert.exists(result.response);
    assert.exists(result.response?.body);
    // capture movie id from response -- used in downstream values
    this.movieId = result.response?.body?.id;
    this.requestSuite.log.info(`Created movie: id=${this.movieId}`);
}
```
Applying the `@test` decorator to a method automatically makes it a Ply case. At this point `this.requestSuite` has already 
been loaded from request YAML (in the case suite's constructor):
```typescript
this.requestSuite = ply.loadSuiteSync('test/requests/movies-api.ply.yaml');
```
Then in `createMovie()` above, the request named 'createMovie' from movies-api.ply.yaml is invoked by calling Ply's API
method [Suite.run()](https://ply-ct.github.io/ply/api-docs/classes/suite.html#run).

Running a case suite from the command line is similar to running a request suite:
```
ply test/cases/movieCrud.ply.ts
```
This executes all cases in movieCrud.ply.ts (in the order they're declared), and compiles actual results from all requests
into a file named after the `@suite` ("movie-crud.yaml"). At the end of the run, actual results are compared against expected
to determine whether the suite has passed. 

### GraphQL
Body content in request YAML can be any text payload (typically JSON). GraphQL syntax is also supported, as in this
example which queries the [GitHub GraphQL API](https://docs.github.com/en/graphql) for ply-demo repository topics: 
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

## Documentation

### Guide
<https://ply-ct.github.io/ply/>

### API
<https://ply-ct.github.io/ply/api>

## Demo

### Example Project
<https://github.com/ply-ct/ply-demo/>

## VS Code Extension
<https://github.com/ply-ct/vscode-ply/>  
TODO: marketplace link



