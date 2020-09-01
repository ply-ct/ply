---
layout: topic
---
## Results
When you run a request in Ply, it generates actual results in [YAML](http://yaml.org/) format representing
each submitted request along with its corresponding response. These results are saved to a file named after your request
suite. The location of this file is governed by [Ply config](config) value `actualLocation` (eg: "test/results/actual").
The result fragment below comes from running the `movieById` request in ply-demo's "movie-queries.ply.yaml". Notice that 
ply inserts comments to reflect start time and response time. YAML comments are ignored when comparing results.
```yaml
movieById:  # 8/31/2020, 17:42:08:241
  request:
    url: 'http://localhost:3000/movies/269b34c1'
    method: GET
    headers:
      Accept: application/json
  response:  # 2 ms
    status:
      code: 200
      message: OK
    headers:
      content-type: application/json; charset=utf-8
    body: |-
      {
        "credits": [
          {
            "name": "Tod Browning",
            "role": "director"
          },
          {
            "name": "Bela Lugosi",
            "role": "actor"
          },
          {
            "name": "Helen Chandler",
            "role": "actor"
          },
          {
            "name": "David Manners",
            "role": "actor"
          },
          {
            "name": "Dwight Frye",
            "role": "actor"
          },
          {
            "name": "Edward Van Sloan",
            "role": "actor"
          }
        ],
        "description": "The only thing more amazing than Lugosi's out-of-body performance is the fact that the finest horror movie ever made was filmed within 2 years of the advent of talking pictures.",
        "id": "269b34c1",
        "poster": "drac.jpg",
        "rating": 5,
        "title": "Dracula",
        "webRef": {
          "ref": "tt0021814",
          "site": "imdb.com"
        },
        "year": 1931
      }
```
Actual results YAML files created by Ply include segments for each request included in that suite's run (in execution order). If you run 
only a [single request](requests#run-a-single-request) instead of a whole suite, the actual results file will contain results for **only**
that request. When verifying, Ply compares whichever request(s) appear in actual results against their counterparts in expected results
as described below.

## Expected Results
Unless run with the `--exercise` (`-x`) option, after generating actual results Ply will proceed to compare against
expected results. Expected results are named after your request suite and are found under your configured `expectedLocation`
(eg: test/results/expected). Here's ply-demo's `movieById` expected fragment corresponding to the actual fragment above.
```yaml
movieById:
  request:
    url: '${baseUrl}/${@moviesByYearAndRating.response.body.movies[0].id}' # id from previous response
    method: GET
    headers:
      Accept: application/json
  response:
    status:
      code: 200
      message: OK
    headers:
      content-type: application/json; charset=utf-8
    body: |-
      {
        "credits": [
          {
            "name": "Tod Browning",
            "role": "director"
          },
          {
            "name": "Bela Lugosi",
            "role": "actor"
          },
          {
            "name": "Helen Chandler",
            "role": "actor"
          },
          {
            "name": "David Manners",
            "role": "actor"
          },
          {
            "name": "Dwight Frye",
            "role": "actor"
          },
          {
            "name": "Edward Van Sloan",
            "role": "actor"
          }
        ],
        "description": "The only thing more amazing than Lugosi's out-of-body performance is the fact that the finest horror movie ever made was filmed within 2 years of the advent of talking pictures.",
        "id": "${@moviesByYearAndRating.response.body.movies[0].id}",
        "poster": "drac.jpg",
        "rating": ${rating},
        "title": "Dracula",
        "webRef": {
          "ref": "tt0021814",
          "site": "imdb.com"
        },
        "year": ${year}
      }
```
You may include YAML comments in expected results, and all comments are ignored by Ply when verifying. Our `movieById`
example has a comment after `url`. End-of-line comments like this work better than comments on separate lines, because 
they make for friendlier side-by-side comparisons in [VS Code]().

### Response headers
Only `content-type` appears in response headers for `movieById` expected results. We include only the response headers
whose values we care to verify. The response in our actual YAML at the top of this page includes only this header as well.
Run the suite with Ply's `verbose` option to see all the response headers actually returned by the server:
```
ply --verbose test/requests/movie-queries.ply.yaml
```
Yet in actual results, Ply retains just those response headers that appear in expected, so that comparison is straightforward.

## Expressions
Like request YAML, expected results can embed JavaScript [template literal](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Template_literals) 
expressions. Expressions always take the form <code class="language-plaintext highlighter-rouge">${<i><span style="color:#5f9ea0;">expression</span></i>}</code>,
and are evaluated at runtime before comparing against actual results.

Some examples from `movieById`:
### Value substitution
```yaml
movieById:
  request:
    url: '${baseUrl}/...'
```
This illustrates simple evaluation of JSON [values](values) files. Nested objects are supported (like `${queries.highlyRated1935}` 
elsewhere in this suite).
### Previous requests/responses
```yaml
movieById:
  # ...
  response:
    body:  |-
      {
        ...
        "id": "${@moviesByYearAndRating.response.body.movies[0].id}",
        ...
      }
```
In the `movieById` request URL, ID comes from the first movie in our response body from previous request `moviesByYearAndRating`.
So we expect that the same ID will appear in our `movieById` response body. After the opening curly brace in our expression, 
special designator `@` allows us to reference previously-submitted requests/responses within the same suite.
### Regular expressions
```yaml
moviesByYearAndRating:
  # ...
  response:
    body:  |-
      {
        ...
        "id": "${~[a-f0-9]}+",
        ...
      }
```
In the initial `moviesByYearAndRating` result shown above, instead of hardcoding IDs in the response, we allow
any hexidecimal string value, since that's the expected format. To achieve this we use a regular expression, signified by 
special designator `~`.

Next Topic: [Values](values)
