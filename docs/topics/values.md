---
layout: topic
---
# Values
Values provide a way to parameterize request content and response matching per environment or other varying conditions. Values files are JSON format.
For example, here's ply-demo's [ply-ct.json](https://github.com/ply-ct/ply-demo/blob/main/test/values/ply-ct.json) values file:
```json
{
  "baseUrl": "https://ply-ct.org/movies"
}
```
Properties such as `baseUrl` are referenced in requests ([movie-queries.ply.yaml](https://github.com/ply-ct/ply-demo/blob/main/test/requests/movie-queries.ply.yaml))
like so:
```yaml
moviesByYearAndRating:
  url: '${baseUrl}/movies?year=${year}&rating=${rating}'
```
The expression syntax here is that of JavaScript [template literals](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Template_literals). 

JSON objects containing values can also be nested. You could just as well declare `baseUrl` in a structure like this:
```json
{
  "moviesApi": {
    "baseUrl": "https://ply-ct.org/movies"
  }
}
```
Then your expression would be:
```yaml
moviesByYearAndRating:
  url: ${moviesApi.baseUrl}/ #...
```

As described in [Results](results), expressions like these can also be embedded in your expected results files.

## Specifying Values Files
Values files for test execution can be designated in [plyconfig](config) or on the [command line](cli).
Multiple values files may be specified, in which case their JSON objects are deep-merged, with later entries taking precedences over earlier.
So in `valuesFiles` from ply-demo's [plyconfig.yaml](https://github.com/ply-ct/ply-demo/blob/main/plyconfig.yaml):
```yaml
valuesFiles:
  test/values/global.json: on
  test/values/ply-ct.json: on
  test/values/localhost.json: off
```
or in list form:
```yaml
valuesFiles:
  - test/values/global.json
  - test/values/ply-ct.json
  # - test/values/localhost.json
```
Either way, in this example same-named properties from ply-ct.json supersede those from global.json.

As with other Ply options, `valuesFiles` specified on the command line take precedence over the `valuesFiles` array in plyconfig.
No merging is performed among values objects provided by these separate methods. For example, if you run `ply --valuesFiles "a.json, b.json"`, then
only a.json and b.json will be considered (not any files designated in plyconfig).

Values files that are specified but not present on the file system are simply ignored and no error is thrown.

## Environment Variables
For secrets and other sensitive values, environment variables in the form `${ENV_VAR_NAME}` are replaced in values files. Here's an example
from [ply-demo global.json](https://github.com/ply-ct/ply-demo/blob/main/test/values/global.json):
```json
{
  "github": {
    "organization": "ply-ct",
    "repository": "ply",
    "token": "${GITHUB_TOKEN}"
  }  
}
```
**Note:** The legacy JSON-format environment variable PLY_VALUES is deprecated


## Rowwise Values
Ply supports [iterative test execution](iterate), which is indicated simply by including a .csv or .xlsx file among `valuesFiles`:
```yaml
valuesFiles:
  - test/values/localhost.json
  - test/values/forties-movies.csv
```
Only one .csv/.xlsx file may be included. Ply will repeatedly run each test for every row in the dataset. Same-named values from .csv/xlsx rows
always take precedence over those from .json files.

See [Iterating](iterate#syntax) for details on rowwise values syntax.

## Runtime Values
As discussed previously under [Results](results#runtime-values), values are automatically supplemented with request/response objects from previous requests
in the running suite. Thus in a results file you can reference the "id" value from the moviesByYearAndRatting response: `${@moviesByYearAndRating.response.body.movies[0].id}`.
When populating runtime values, Ply will convert their body contents to objects if they're parseable as JSON. Otherwise, any body content is treated as a raw string.

Furthermore, in Ply [Cases](cases) you can programmatically add runtime values yourself. For example, take a look at the 'update rating' test in ply-demo's 
[movieCrud.ply.ts] (https://github.com/ply-ct/ply-demo/blob/main/test/cases/movieCrud.ply.ts):
```typescript
    @test('update rating')
    async updateRating(values: any) {
        values.id = this.movieId;
        values.rating = 4.5;
        await this.requestSuite.run('updateMovie', values);
        // ...
    }
```
Before submitting 'updateMovie', this test adds values for "id" (from the previous response), and also for "rating".
These changes are cumulative, so subsequent tests can modify values as needed for downstream requests.

**Note:** Runtime value objects must be serializable as JSON.

## Precedence
User-specified values take precedence in the following order (highest to lowest):
  1. Values specified in the popup when running a [flow](flows)
  1. Fixed values defined in flow via the Values configurator tab
  1. Runtime values set programmatically or autopopulated from previous requests
  1. Values loaded from the list of files in plyconfig.yaml/yml/json or on the command line

Next Topic: [Iterating](iterate)
