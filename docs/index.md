---
layout: page
---

<h1>Friendly API Autotesting</h1>

<div style="font-size:18px">
Ply is simply a more intuitive way to automate REST and GraphQL API testing.
</div>

<h2>Graphical, flow-driven test suites</h2>
<img src="./img/flow-driven.png" alt="flow-driven" width="1223px" class="intro-shot">

<h2 style="margin-top:-15px">Visual, side-by-side results</h2>
<img src="./img/side-by-side.png" alt="side-by-side" width="1182px" class="intro-shot">

<div class="site-content">
  <div class="split">
    <div class="split-two">
      <h2>Techniques</h2>
      <ul>
        <li>Ply works over HTTP and doesn't care what platform your API runs on</li>
        <li>Three different types of test artifacts:  <a href="topics/requests">Requests</a>, <a href="topics/flows">Flows</a>, and <a href="topics/cases">Cases</a></li>
        <li>Expected results are YAML files, compared with actual results during verification</li>
        <li>Auto-generate result files by capturing actual good responses</li>
        <li>Reference environment values and/or upstream response props using <a href="https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Template_literals">template expressions</a></li>
        <li>Built-in GraphQL support providing the same intuitive workflow as REST</li>
        <li>The <a href="https://github.com/ply-ct/ply-demo">ply-demo</a> project illustrates best practices</li>
        <li>Import Ply requests from <a href="https://www.postman.com/" target="_blank" rel="noreferrer noopener nofollow">Postman</a> collections</li>
        <li>Augment <a href="https://www.openapis.org/">OpenAPI</a> specs with example requests/responses and code snippets from Ply autotests</li>
        <li>Test artifacts are simply files that can be committed to version control systems such as Git</li>
      </ul>
    </div>
    <div class="split-two">
      <h2>Toolset</h2>
      <ul>
        <li>Install Ply's <a href="https://marketplace.visualstudio.com/items?itemName=ply-ct.vscode-ply">VS Code extension</a></li>
        <li>Request editor for intuitive creation of reusable Ply requests</li>
        <li>Graphical flow builder makes it easy to sequence requests</li>
        <li>Side-by-side diff view compares expected/actual, with smart decorations aware of runtime values</li>
        <li><a href="https://github.com/ply-ct/ply#readme">Command-line interface</a> for integrating into CI/CD pipelines</li>
        <li>Decorations on your Ply test flows and files display test statuses and results</li>
        <li>Ply sidebar shows all Ply flow/request/case suites along with their statuses</li>
        <li>CodeLens links in your Ply test files for running and debugging tests</li>
      </ul>
    </div>
  </div>


</div>
