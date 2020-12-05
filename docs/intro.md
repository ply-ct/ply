---
layout: page
---


<h2>API Automated Testing
<div>
<a href="https://ply-ct.github.io/ply/topics/requests">
  <img src="https://raw.githubusercontent.com/ply-ct/ply/master/docs/img/wares.png" width="128" alt="Ply your wares" />
</a>
</div>
</h2>

Ply is simply a more intuitive way of autotesting your REST and GraphQL APIs. Start with a YAML file describing your requests. Run Ply to submit these requests and compare actual results against expected, with template literal placeholders for dynamic values. The Ply extension gives you a side-by-side diff view so you can compare results at a glance.

<div>
  <img src="img/diff.png" width="945" alt="Diff" />
</div>

Checkmarks indicate diff lines that're okay, such as substituted values or comments; whereas Xs indicate significant differences causing test failure(s).

When you need greater control, Ply cases give you programmatic access via TypeScript to supplement this built-in expected/actual verification.


## Features
Test Explorer sidebar shows all Ply requests/cases/suites along with their statuses
CodeLens segments in your Ply test files for running tests and debugging cases
Gutter decorations on your Ply test files showing test statuses
Test log displayed in Output view when a test is selected in Test Explorer
Diff editor for comparing expected/actual results, with smart decorations aware of runtime values
Import Ply requests from Postman collections

<p><img src="img/recording.gif" alt="recording"></p>

## Compare to Postman

<table>
<thead>
<tr>
<th>Feature</th>
<th>Ply</th>
<th>Postman</th>
</tr>
</thead>
<tbody>
<tr>
<td>Graphical Result Comparison</td>
<td>Yes</td>
<td>No</td>
</tr>
<tr>
<td>Graphical Orchestration of APIs</td>
<td>Yes</td>
<td>No</td>
</tr>

</tbody>
</table>
