---
layout: topic
---
## CLI
The CLI is how you can run Ply directly from the command line and also automatically as part of your 
continuous integration cycle. Running ply without any arguments will execute all requests/cases (except
those that are ignored or skipped).

## Command-Line Only Arguments

| Option | Default |
| :----- | :------ |
| **<code>--version, -v</code>** | Show version number
| **<code>--help, -h</code>** | Show help
| **<code>--config</code>** | Specify path to [plyconfig file](options) (overrides default search mechanism)

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

Next Topic: [Options](options)
