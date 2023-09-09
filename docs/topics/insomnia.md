---
layout: topic
---
# Insomnia

Ply can import [Insomnia](https://docs.insomnia.rest/) collections into request YAML files.
The [ply-demo](https://github.com/ply-ct/ply-demo) repository contains an example Insomnia
collection, which you can import like this:
```
ply --import=insomnia --importToSuite test/insomnia/insomnia-movies.yaml
```
Here's the output from this import:
```
Importing: "test/insomnia/insomnia-movies.yaml"
Creating: test/Insomnia Collection/movies.ply.yaml
Creating: test/Insomnia Collection/movies/by rating.ply.yaml
Creating: test/Insomnia Collection/movies/by rating/good.ply.yaml
Creating: test/Insomnia Collection/movies/by rating/great.ply.yaml
Creating: test/Insomnia Collection/movies/actors.ply.yaml
Overwriting: test/values/Base Environment.json
Overwriting: test/values/localhost.json
Overwriting: test/values/ply-ct.json
```
Note that this import includes Insomnia environments as well as request collections.

The ply-demo repo includes expected results for the sample collection (under test/results/expected/Insomnia Collection), 
so you can run these newly-imported requests and they should pass:
```
ply "test/Insomnia Collection/**/*"
```
```
...
Overall Results: {"Passed":9,"Failed":0,"Errored":0,"Pending":0,"Submitted":0}
```

## Import Individual Requests
Above we included the `importToSuite` option to import collections into request suites (.yaml files). By default, without
this option, collections are instead imported to individual (.ply) requests.
```
ply --import=insomnia "test/insomnia/insomnia-movies.yaml"
```

## VS Code
To import from Insomnia using the Ply VS Code extension, click the Ply activity icon, dropdown the meatball menu
(`...`) in its toolbar, and select "Import from Insomnia". Then browse for your exported Insomnia collection file.

Next Topic: [OpenAPI](openapi)
