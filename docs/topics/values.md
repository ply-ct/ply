---
layout: topic
---
## Values
Values provide a way to parameterize request content and response matching per environment or other varying condition. Values files are JSON format.
For example, here's ply-demo's [localhost.json](https://github.com/ply-ct/ply-demo/blob/master/test/values/localhost.json) values file:
```json
{
  "baseUrl": "http://localhost:3000/movies"
}
```
Properties such as `baseUrl` are referenced in requests ([movie-queries.ply.yaml](https://github.com/ply-ct/ply-demo/blob/master/test/requests/movie-queries.ply.yaml))
like so:
```yaml
moviesByYearAndRating:
  url: '${baseUrl}?year=${year}&rating=${rating}'
```
The expression syntax here is that of JavaScript [template literals](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Template_literals). 

JSON objects containing values can also be nested. You could just as well declare `baseUrl` in a structure like this:
```json
{
  "moviesApi": {
    "baseUrl": "http://localhost:3000/movies"
  }
}
```
Then your expression would be:
```yaml
moviesByYearAndRating:
  url: '${moviesApi.baseUrl}...'
```

As described in [Results](results), expressions like these can also be embedded in your expected results files.

## Specifying Values Files
Values files for test execution can be designated in [plyconfig](config), on the [command line](cli), or in [VS Code extension](vscode-ply) settings.
Multiple values files can be specified, in which case their JSON objects are deep-merged, with later entries taking precedences over earlier.
So in `valuesFiles` from ply-demo's [plyconfig.json](https://github.com/ply-ct/ply-demo/blob/master/plyconfig.json):
```json
{
  "valuesFiles": [
    "test/values/global.json",
    "test/values/localhost.json",    
    "~/.ply/auth.json"
  ]
}
```
same-named properties from auth.json superseded those from localhost.json, which supersede those from global.json.

## Runtime Values
As discussed previously under [Results](results#runtime-values), values are automatically supplemented with request/response objects from previous requests
in the running suite. Thus in a results file you can reference the "id" value from the moviesByYearAndRatting response: `${@moviesByYearAndRating.response.body.movies[1].id}`.
When populating runtime values, Ply will convert their body contents to objects if they're parseable as JSON. Otherwise, any body content is treated as a raw string.

Furthermore, in Ply [Cases](cases) you can programmatically add runtime values yourself. For example, take a look at the 'update rating' test in ply-demo's 
[movieCrud.ply.ts] (https://github.com/ply-ct/ply-demo/blob/master/test/cases/movieCrud.ply.ts):
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

Next Topic: [Cases](cases)
