<a href="https://ply-ct.org">
  <img alt="ply-logo" src="https://raw.githubusercontent.com/ply-ct/ply/master/docs/img/ply.png" width="128">
</a>
<br><br>
<a href="https://github.com/ply-ct/ply/actions">
  <img src="https://github.com/ply-ct/ply/workflows/build/badge.svg" />
</a>
<a href="https://github.com/ply-ct/ply/actions">
  <img src="https://ply-ct.org/badges/ply-ct/ply/workflows/build" />
</a>
<a href="https://github.com/ply-ct/ply/actions">
  <img src="https://github.com/ply-ct/ply/workflows/CodeQL/badge.svg" />
</a>

<h2>API Automated Testing
<div>
<a href="https://ply-ct.org">
  <img src="https://raw.githubusercontent.com/ply-ct/ply/master/docs/img/wares.png" width="128" alt="Ply your wares" />
</a>
</div>
</h2>

  - [Installation](#installation)
  - [Usage](#usage)
    - [Submit a request](#submit-a-request)
    - [Verify response](#verify-response)
    - [Expected results](#expected-results)
  - [Documentation](#documentation)
    - [Guide](guide)
    - [CLI](cli)
    - [API](api)
  - [Demo](#demo-project)
  - [VS Code Extension](#vs-code-extension)

## Installation
```
npm install @ply-ct/ply --save-dev
```
Or, to run anywhere:
```
npm install -g @ply-ct/ply
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

### Submit a request
Suppose you save this in a file named "github.ply.yaml". Then you can submit the
`repositoryTopics` request from a command line by typing:
```
ply -s github.ply.yaml
```
The `-s` argument tells Ply not to verify the response (`-s` is short for `--submit`, 
meaning submit an *ad hoc* request and don't bother with verification).

### Verify response
If you run without `-s` you'll get an error saying, "Expected result file not found". Ply verification
works by comparing expected vs actual. So a complete test requires an expected result file. Run again
with `--create`, and the expected result file will be created from the actual response.
```shell
ply --create github.ply.yaml
```
Output looks like this:
```shell
Request 'repositoryTopics' submitted at 4/11/2022, 11:19:46:292
Creating expected result: ./results/expected/github.yaml
Request 'repositoryTopics' PASSED in 332 ms

Overall Results: {"Passed":1,"Failed":0,"Errored":0,"Pending":0,"Submitted":0}
Overall Time: 373 ms
```
During execution Ply submits the request and writes **actual** result file "./results/actual/github.yaml"
based on the response. Because of `--create`, Ply then copies the actual result over **expected** result file "./results/expected/github.yaml"
before comparing. This test naturally passes since the results are identical.

### Expected results
Auto-creating an expected result provides a good starting point. But if you run the request again (without creating), it'll fail:
```shell
ply github.ply.yaml
Request 'repositoryTopics' submitted at 4/11/2022, 11:20:44:478
Request 'repositoryTopics' FAILED in 372 ms: Results differ from line 24
24
-       x-github-request-id: E8C2:3201:51B1B:D9917:62546332
+       x-github-request-id: E8C3:7857:386D8:7DDEE:6254636C
===
26
-       x-ratelimit-remaining: '56'
+       x-ratelimit-remaining: '55'
===
29
-       x-ratelimit-used: '4'
+       x-ratelimit-used: '5'
===
```

But looking at "./results/expected/github.yaml",
you'll notice that it includes many response headers that are not of interest for testing purposes. Here's a
cleaned-up version of similar expected results from [ply-demo](https://github.com/ply-ct/ply-demo/blob/master/test/requests/github-api.ply.yaml#L1):
```yaml
repositoryTopics:
  request:
    url: https://api.github.com/repos/${github.organization}/${github.repository}/topics
    method: GET
    headers:
      Accept: application/vnd.github.mercy-preview+json
  response:
    status:
      code: 200
      message: OK
    headers:
      content-type: application/json; charset=utf-8
    body: |-
      {
        "names": [
          "rest-api",
          "testing",
          "ply",
          "example-project",
          "graphql",
          "typescript",
          "workflow"
        ]
      }
```
The subset of response headers included in expected results YAML are those we care about for comparison.
In this test, body content is our main concern.

### Expressions
Something else about this example that may be noticed by sharp-eyed observers: our request URL contains
placeholders like `${github.organization}`. Ply supports JavaScript [template literal](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Template_literals)
syntax for substituting dynamic values in both requests and results. Values come from JSON files and/or environment variables,
as described in the docs under [Values](https://ply-ct.github.io/ply/topics/values).

Even more powerfully, your multi-request suites can embed expressions that reference runtime values from previous responses.
For instance, the URL or body of a subsequent request in our github.ply.yaml file could have something like this:
```
${@repositoryTopics.response.body.names[0]}
```
which uses the special `@` character to reference the first topic name from above (resolving to 'rest-api').
This enables you to string together sequential requests that each depend on response output from preceding ones.
Check out the [Results](https://ply-ct.github.io/ply/topics/results) topic for details and examples.

### Flows
If you have [Visual Studio Code](https://code.visualstudio.com/) with the [Ply extension](https://marketplace.visualstudio.com/items?itemName=ply-ct.vscode-ply),
you can graphically chain multiple requests into a workflow. See the [Ply flows documentation](https://ply-ct.org/ply/topics/flows) for details.

Flows can include [custom TypeScript steps](https://ply-ct.org/ply/topics/steps) to perform complex interactions and update runtime values.

Running a flow from the command line is similar to running a request suite:
```
ply test/flows/movies-api.flow
```

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
<https://ply-ct.org/ply/topics/requests>

### API
<https://ply-ct.org/ply/api>

### CLI
<https://ply-ct.org/ply/topics/cli>

## Demo Project
<https://github.com/ply-ct/ply-demo/>


## VS Code Extension
<https://marketplace.visualstudio.com/items?itemName=ply-ct.vscode-ply>  



