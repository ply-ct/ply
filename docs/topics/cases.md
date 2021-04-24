---
layout: topic
---
# Cases
Real-world APIs need powerful test automation. Ply cases deliver ultimate control by enabling you to run your 
requests programmatically using [TypeScript](https://www.typescriptlang.org/).

Case suites are signified by applying the `@suite` decorator to a TypeScript class:
```typescript
@suite('movie-crud')
export class MovieCrud {
```
Within a suite, test methods are marked by the `@test` decorator:
```typescript
  @test('add new movie')
  async createMovie(values: any) {
```
The name parameter is optional in both `@suite` and `@test`. If not specified, this defaults to class/method name.

When a case suite is executed here's what happens:
  - Any `@before` decorated methods are invoked
  - All `@test` methods are invoked, in the order they appear in the class
  - Typically these `@test` methods run one or more requests programmatically
  - Results from each request are appended to the case [result](results) file
  - Any `@after` decorated methods are invoked
  - To verify, overall actual result YAML is compared against expected

Let's walk through ply-demo's [movieCrud.ply.ts](https://github.com/ply-ct/ply-demo/blob/master/test/cases/movieCrud.ply.ts)
suite to further understand how Ply cases relate to requests. MovieCrud's constructor loads a request suite by calling
[loadSuiteSync](https://ply-ct.github.io/ply/api-docs/classes/ply.html#loadsuitesync):
```typescript
  constructor() {
    this.requestSuite = ply.loadSuiteSync('test/ply/requests/movies-api.ply.yaml');
  }
```
Our first test method, `createMovie()` runs a request and captures the result:
```typescript
  @test('add new movie')
  async createMovie(values: any) {
      const result = await this.requestSuite.run('createMovie', values);
      assert.strictEqual(result.response?.status?.code, 201);
      assert.exists(result.response?.body);
      // capture movie id from response -- used in downstream values
      this.movieId = result.response?.body?.id;
      this.requestSuite.log.info(`Created movie: id=${this.movieId}`);
  }
```
Here we're using [Chai](https://www.chaijs.com/) assertions to programmatically verify response status
(technically unnecessary since status code is included in Ply's results comparison). The main point is
to capture movieId from the response body so that we can use it in subsequent tests.

The next test method, `updateRating()` runs the 'updateMovie' PATCH request and then a GET to verify the update:
```typescript
  @test('update rating')
  async updateRating(values: any) {
      // update movie rating -- using id returned from createMovie request
      values.id = this.movieId;
      values.rating = 4.5;
      await this.requestSuite.run('updateMovie', values);
      // confirm the update
      await this.requestSuite.run('retrieveMovie', values);
  }
```
Notice that [values](values) are passed into our test method, and that we're updating them programmatically
to set id to what we previously captured, and rating to 4.5. These are used by 'updateMovie' in the
movies-api.ply.yaml request suite we've loaded:
```yaml
updateMovie: # PATCH
  url: '${baseUrl}/movies/${id}'
  method: PATCH
  headers:
    Accept: application/json
    Content-Type: application/json
  body: |-
    {
      "rating": ${rating}
    }
```
You might ask how we can "confirm the update" in `updateRating()` above simply by running the 'retrieveMovie' request. 
Remember: all requests/responses are appended to the result file for verification once the case suite is finished.

Lastly we clean up after ourselves by deleting the movie we've created:
```typescript
  @test('remove movie')
  async deleteMovie(values: any) {
      // delete movie
      await this.requestSuite.run('deleteMovie', values);
      // confirm the delete
      await this.requestSuite.run('retrieveMovie', values);
  }
```
The 'deleteMovie' request needs movie id in its values, but we don't need to set it here because Ply 
preserves the updates we applied previously in our `updateRating()` test method.

### @before/@after
Methods decorated with `@before` are invoked by Ply prior to calling test methods. Here we're cleaning
up any movie left over from previous tests that failed to complete:
```typescript
  @before
  async beforeAll(values: any) {
      const deleteMovie = this.requestSuite.get('deleteMovie');
      assert.exists(deleteMovie);
      const response = await deleteMovie!.submit({...values, id: '435b30ad'});
      this.requestSuite.log.info('Cleanup response status code', response.status.code);
      // response status should either be 200 or 404 (we don't care which during cleanup)
      assert.ok(response.status.code === 200 || response.status.code === 404);
  }
```
By default, with no parameters to `@before`, our decorated method is called once before
any tests are run. To designate that it should be called before each test, we'd decorate 
with `@before('*')`. The parameter is a glob pattern indicating which test(s) the method
should be called before. The `@after` decoration behaves similarly.

Another thing to note in `beforeAll()` is that we're calling `submit()` on the request
instead of `run()` through the suite. This way we avoid including cleanup requests/responses
in our results.

## Running
Like requests, cases can be run via [Ply CLI](cli), or within Visual Studio Code by installing 
the [Ply Extension](https://marketplace.visualstudio.com/items?itemName=ply-ct.vscode-ply).

### ply-movies
Unlike previous exercises in this guide, our movie-crud case suite performs updates and changes
data. This is not permitted on the movies API hosted at ply-ct.com. Luckily it's easy to run
[ply-movies](https://github.com/ply-ct/ply-movies#readme) locally. First, change the valuesFiles
section in plyconfig.json to use localhost:
```json
  "valuesFiles": [
    "test/values/global.json",
    "test/values/localhost.json"
  ]
```
Here's how to start/stop ply-movies server as a background process through npm scripts:
```
cd ply-demo
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

### CLI execution
The command to run our movie-crud case suite is like this:
```
ply test/cases/movieCrud.ply.ts
```
And voila:
```
Running 'add new movie'
Cleanup response status code: 404
Request 'createMovie' submitted at 9/26/2020, 13:32:22:135
Movie created with id: 435b30ad
Created movie: id=435b30ad
Case 'add new movie' PASSED in 106 ms
Running 'update rating'
Request 'updateMovie' submitted at 9/26/2020, 13:32:22:184
Request 'retrieveMovie' submitted at 9/26/2020, 13:32:22:193
Case 'update rating' PASSED in 21 ms
Running 'remove movie'
Request 'deleteMovie' submitted at 9/26/2020, 13:32:22:204
Request 'retrieveMovie' submitted at 9/26/2020, 13:32:22:212
Case 'remove movie' PASSED in 15 ms

Overall Results: {"Passed":3,"Failed":0,"Errored":0,"Pending":0,"Submitted":0}
Overall Time: 1689 ms
```
Take a look at actual result file test/results/actual/cases/movie-crud.yaml
to see how it includes all requests/responses for the entire suite.

### Skipped requests
The requests in movies-api.ply.yaml are meant to be used by our movie-crud case.
We don't want these to be run as standalone requests when we run all tests by executing
simply `ply` from the command line (or running all in VS Code). To avoid running
these requests directly, we mark them as skipped in plyconfig.json:
```json
  "skip": "requests/movies-api.ply.yaml"
```


Next Topic: [Postman](postman)
