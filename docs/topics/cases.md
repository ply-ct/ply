---
layout: topic
---
## Cases
Real-world APIs need powerful testing tools. Ply cases deliver ultimate control by enabling you to invoke your 
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

When a case suite is executed here's what happens:
  - Any `@before` decorated methods are invoked
  - All `@test` methods are invoked, in the order they appear in the class
  - Typically `@test` methods run one or more requests programmatically
  - Results from each request are appended to the case result
  - Any `@after` decorated methods are invoked
  - Overall actual result YAML is compared against expected, to verify

Let's walk through ply-demo's [movieCrud.ply.ts](https://github.com/ply-ct/ply-demo/blob/master/test/cases/movieCrud.ply.ts)
suite to further understand how Ply cases relate to requests. MovieCrud's constructor loads a request suite:
```typescript
    constructor() {
        this.requestSuite = ply.loadSuiteSync('test/requests/movies-api.ply.yaml');
    }
```

TODO: more to come here

## Running

### ply-movies
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


Next Topic: [Postman](postman)
