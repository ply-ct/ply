---
layout: topic
---
# Postman

Ply can import [Postman](https://www.postman.com/) collections into request YAML files.
In fact, the [ply-demo](https://github.com/ply-ct/ply-demo) repository already contains 
the Postman Echo collection, which you can import like this:
```
ply --import=postman --importToSuite "test/postman/Postman Echo.postman_collection.json"
```
Here's the output from this import:
```
Importing: "test/postman/Postman Echo.postman_collection.json"
Request test/Postman Echo/Request Methods/POST Form Data not imported due to: Unsupported request body mode: urlencoded
Creating: test/Postman Echo/Request Methods.ply.yaml
Creating: test/Postman Echo/Headers.ply.yaml
Creating: test/Postman Echo/Authentication Methods.ply.yaml
Creating: test/Postman Echo/Cookie Manipulation.ply.yaml
Creating: test/Postman Echo/Utilities.ply.yaml
Creating: test/Postman Echo/Utilities / Date and Time.ply.yaml
Creating: test/Postman Echo/Utilities / Postman Collection.ply.yaml
Creating: test/Postman Echo/Auth- Digest.ply.yaml
```
The ply-demo repo also includes expected results for Postman Echo (under test/results/expected/Postman Echo), 
so you can run these newly-imported requests and they should pass:
```
ply "test/Postman Echo/**/*"
```
```
...
Overall Results: {"Passed":36,"Failed":0,"Errored":0,"Pending":0,"Submitted":0}
```

## Import Individual Requests
Above we included the `importToSuite` option to import collections into request suites (.yaml files). By default, without
this option, collections are instead imported to individual (.ply) requests.
```
ply --import=postman --importToSuite "test/postman/Postman Echo.postman_collection.json" 
```

## Values Files
You can also import from Postman exported environments JSON into Ply values files:
```
ply --import=postman "myenv.postman_environment.json"
```

## VS Code
To import from Postman using the Ply VS Code extension, click the Ply activity icon, dropdown the meatball menu
(`...`) in its toolbar, and select "Import from Postman". Then browse for your exported Postman collection file.

Next Topic: [Insomnia](insomnia)
