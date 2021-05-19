---
layout: topic
---
# Getting Started
Ply is all about automated testing of REST (and GraphQL) APIs. By running Ply tests, 
you're sending actual HTTP requests to exercise your service endpoints.

You can run Ply by [installing](install) the VS Code extension and/or command line interface.
Ply tests come in three flavors:
  - [Flows](flows)  
    Flow files end with .flow (.ply.flow is preferred). Format is either YAML or JSON,
    although you wouldn't want to edit a Ply flow directly as text. Use the graphical editor
    in VS Code.
  - [Requests](requests)  
    Requests appear in YAML files that you **do** edit directly, with extension .yaml/yml (or .ply.yaml/yml).
    Multiple requests in a YAML file are referred to collectively as a *suite*.
  - [Cases](cases)  
    Cases are written in TypeScript, ending in .ts (or .ply.ts). Write a Ply case when you need to
    programmatically execute requests and interrogate responses.

## Results
When responses are received by Ply, they're compared against an [Expected Results](results#expected-results)
file, which is in YAML format and may contain [expressions](results#expected-results) to parameterize dynamic values.

## Jump right in
Want to get straight to building a Ply flow? Proceed to the [walkthrough](flows) topic in this guide.

Next Topic: [Flows](flows)