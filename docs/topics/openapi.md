---
layout: topic
---
# OpenAPI

## Augment API docs
If your API is implemented in TypeScript, you can use the Ply [CLI](cli) to enhance the 
quality of OpenAPI samples by leveraging your Ply requests and responses. Ply will also add code
snippets in TypeScript, Python and Java under the 
[Redoc x-codeSamples](https://github.com/Redocly/redoc/blob/master/docs/redoc-vendor-extensions.md#x-codesamples)
Swagger extension.
```
ply --openapi=nestjs openapi/movies.yaml
```
Here movies.yaml is augmented with samples and snippets from Ply requests.

An API endpoint method implementation can be tied to its respective Ply request/response through the `@ply` JSDoc tag:
```typescript
/**
 * Create a movie.
 * Add a movie with its details to the collection.
 *
 * @ply
 *   request: test/requests/movies-api.ply#createMovie
 *   responses:
 *     201: test/requests/movies-api.ply#createMovie
 *     400: test/requests/movie-validations.ply#postBadYear
 */
```
As a bonus, if the OpenAPI summary and description for this POST operation are empty in movies.yaml, Ply will set
summary to 'Create a movie' and description to 'Add a movie with its details to the collection'.

Next Topic: [GitHub Action](action)