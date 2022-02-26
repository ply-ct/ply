---
layout: topic
---
# CLI
The CLI is how you can run Ply directly from the command line and also automatically as part of your 
continuous integration cycle. Running ply without any arguments will execute all requests/cases (except
those that are ignored or skipped).


## Installation
Install Ply through [npm](https://www.npmjs.com/package/ply-ct) to use the CLI.
1. Global
   ```
   npm install -g @ply-ct/ply
   ```
   This way you can run `ply` directly from the command line:
   ```
   ply --version
   ```
1. Dev Dependency
   ```
   npm install --save-dev @ply-ct/ply
   ```
   Then you can run ply in your project directory through `npx` or an npm script:
   ```
   npx ply --version
   ```
Command-line exercises in this guide assume you have Ply installed globally.


## Command-Line Only Arguments

| Option | Default |
| :----- | :------ |
| **<code>-h</code>** | Show help
| **<code>--version, -v</code>** | Show version number
| **<code>--config, -c</code>** | Specify path to [plyconfig file](config) (overrides default search mechanism)
| **<code>--submit, -s</code>** | Submit requests but don't verify actual results against expected (ad hoc run)
| **<code>--import</code>** | Import requests or values from specified format. Currently 'postman' and 'insomnia' are supported formats. *Overwrites* existing same-named files.
| **<code>--importToSuite</code>** | Import collections into request suites (.yaml files), instead of individual (.ply) requests.
| **<code>--openapi</code>** | Augment OpenAPI spec with Ply example requests/responses and code samples. *Overwrites* existing OpenAPI spec file.
| **<code>--create</code>** | Create expected result file from actual responses
| **<code>--useDist</code>** | Import case modules from build output (eg dist) instead of from TypeScript sources

<br>
## Command-Line/Config Options
{% include_relative _options.md %}


## Examples
The following examples can be run by cloning the [ply-demo](https://github.com/ply-ct/ply-demo) project.

Run a request suite:
```
ply test/requests/movie-queries.ply.yaml
```

Run a single request:
```
ply test/requests/movie-queries.ply.yaml#moviesByYearAndRating
```

Run a case suite:
```
ply test/cases/movieCrud.ply.ts
```

Run a single case:
```
ply "test/cases/movieCrud.ply.ts#add new movie"
```

Next Topic: [Config](config)
