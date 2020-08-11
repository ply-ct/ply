---
layout: topic
---
## Options
Ply's configuration is defined in a file named plyconfig.json (or plyconfig.yaml or plyconfig.yml).
This config file is found by searching upward in the file system directory structure, starting from cwd.
Options specified as [command line](cli) arguments override values from the config file.

| Option | Default |
| :----- | :------ |
| **<code>testsLocation</code>**<br>**<code>--testsLocation, -t</code>** | `"."` | Tests base directory. Ply finds requests/cases/workflows under here.
| **<code>requestFiles</code>**<br>**<code>--requestFiles, -r</code>** | `"**\/*.{ply.yaml,ply.yml}"` | Request files glob pattern, relative to testsLocation.
| **<code>caseFiles</code>**<br>**<code>--caseFiles, -c</code>** | `"**\/*.ply.ts"` | Case files glob pattern, relative to testsLocation.
| **<code>ignore</code>**<br>**<code>--ignore</code>** | `"**\/{node_modules,bin,dist,out}\/**"` | File pattern to ignore, relative to testsLocation. Ignored files are not even parsed by Ply.
| **<code>skip</code>**<br>**<code>--skip</code>** | | File pattern for requests/cases/workflows that are loaded but shouldn't be directly executed. The use case for 'skip' is requests that are only meant to be run programmatically from within cases.
| **<code>expectedLocation</code>**<br>**<code>--expectedLocation</code>** | `testsLocation + "/results/expected"` | Base directory containing expected result files.
| **<code>actualLocation</code>**<br>**<code>--actualLocation</code>** | `testsLocation + "/results/actual"` | Base directory containing actual result files.
| **<code>resultFollowsTestRelativePath</code>**<br>**<code>--resultFollowsTestRelativePath</code>** | `true` | Result files live under a similar subpath as request/case files. (eg: Expected result relative to 'expectedLocation' is the same as request file relative to 'testsLocation'). Otherwise results directory structure is flat.
| **<code>logLocation</code>**<br>**<code>--logLocation</code>** | `actualLocation` | Base directory for per-suite log files.
| **<code>verbose</code>**<br>**<code>--verbose</code>** | `false` | Display debug/verbose logging output.
| **<code>bail</code>**<br>**<code>--bail</code>** | `false` | Stop execution on first failure.
| **<code>responseBodySortedKeys</code>**<br>**<code>--responseBodySortedKeys</code>** | `true` | Predictable ordering of response body JSON property keys in result files. Usually needed for verification.
| **<code>prettyIndent</code>**<br>**<code>--prettyIndent</code>** | `2` | JSON format indenting for response body content in result files.

