---
layout: topic
---
# Steps
A step in a Ply flow represents a single unit of work, most commonly a [request](requests). Adding and configuring
steps is discussed at length in the [flows](flows) walkthrough.

## Start/stop steps
When you create a new flow it includes both a Start and a Stop step. There should only be one Start step in your
flow. It appears in the toolbox in case you delete it and need to re-add. Multiple Stop steps may be needed when a
branching scenario includes two or more paths (see [Decider step](#decider-step)). Start and Stop steps have no 
functional purpose other than to indicate to the Ply engine where to start and when to stop flow execution.

## Request step
A request step sends an HTTP request to a designated endpoint and captures the response. Configuration elements
include URL, Method, Header and Body. All of these can contain parameterized [values](values).
Clicking on the "Request Editor" link in configurator allows you to easily submit the request in isolation
and tweak its parameters.

Ordinarily a request step is included in expected/actual [results](results) comparison. But the configurator 
"Submit Only" checkbox allows you to override this behavior so that its output is ignored, which can be especially 
useful in the context of setup/teardown [subflows](flows#subflows). Below we don't care whether the DELETE request
returns HTTP `404-Not Found` or `200-OK`; just that the movies is not present when our test begins.  
<img src="../img/request-step.png" alt="Request step" width="778px" class="mac-bs">

## TypeScript step
TODO

## Decider step
TODO 

## Custom steps
While the TypeScript step provides great flexibility, it is limited in one respect: your code cannot be directly
reused in multiple flows. You *can* factor TypeScript logic into common helpers for access from many TypeScript steps, 
which of course is always good practice. But it's also useful to add your own custom steps to the Ply flow Toolbox.

Custom steps require a JSON `descriptor` indicating how they're to be displayed and configured.ideally you should also be able to add your own reusable

## Attributes

Attribute values are always strings.

Next Topic: [Values](values)
