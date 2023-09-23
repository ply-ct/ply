
| Option | Default |
| :----- | :------ |
| **<code>testsLocation</code>**<br>**<code>--testsLocation, -t</code>** | `"."` | Tests base directory. Ply finds requests/cases/flows under here.
| **<code>requestFiles</code>**<br>**<code>--requestFiles</code>** | `"**/*.{ply,ply.yaml,ply.yml}"` | Request files glob pattern, relative to testsLocation.
| **<code>caseFiles</code>**<br>**<code>--caseFiles</code>** | `"**/*.ply.ts"` | Case files glob pattern, relative to testsLocation.
| **<code>flowFiles</code>**<br>**<code>--flowFiles</code>** | `"**/*.ply.flow"` | Flow files glob pattern, relative to testsLocation.
| **<code>ignore</code>**<br>**<code>--ignore</code>** | `"**/{node_modules,bin,dist,out}/**"` | File pattern to ignore, relative to testsLocation. Ignored files are not even parsed by Ply.
| **<code>skip</code>**<br>**<code>--skip</code>** | `"**/*.ply"` | File pattern for requests/cases/flows that are loaded but shouldn't be directly executed (relative to testsLocation). By default, standalone requests (.ply files) are skipped by CLI test execution.
| **<code>expectedLocation</code>**<br>**<code>--expectedLocation</code>** | `testsLocation + "/results/expected"` | Base directory containing expected result files.
| **<code>actualLocation</code>**<br>**<code>--actualLocation</code>** | `testsLocation + "/results/actual"` | Base directory containing actual result files.
| **<code>resultFollowsRelativePath</code>**<br>**<code>--resultFollowsRelativePath</code>** | `true` | Result files live under a similar subpath as request/case files (eg: expected result relative to 'expectedLocation' is the same as request/case file relative to 'testsLocation'). Otherwise results directory structure is flat.
| **<code>logLocation</code>**<br>**<code>--logLocation</code>** | `actualLocation` | Base directory for per-suite log files.
| **<code>valuesFiles</code>**<br>**<code>--valuesFiles</code>** | | JSON files containing Ply values. Array in plyconfig, one comma-separated argument on the command line.
| **<code>outputFile</code>**<br>**<code>--outputFile, -o</code>** | | For reporters, the report output file; otherwise specifies a JSON file summarizing Ply CLI results.
| **<code>verbose</code>**<br>**<code>--verbose</code>** | `false` | Display debug/verbose logging output. Takes precedence over 'quiet' if both are true.
| **<code>quiet</code>**<br>**<code>--quiet</code>** | `false` | The opposite of 'verbose'. Only error/status output is logged.
| **<code>bail</code>**<br>**<code>--bail</code>** | `false` | Stop execution on first failure.
| **<code>parallel</code>**<br>**<code>--parallel</code>** | `false` | Run request/flow/case suites in parallel (but tests within a suite are **always** sequential).
| **<code>batchRows</code>**<br>**<code>--batchRows</code>** | `1` | (For use with [rowwise](values#rowwise-values) values). Number of rows to run per batch.
| **<code>batchDelay</code>**<br>**<code>--batchDelay</code>** | `0` | (For use with [rowwise](values#rowwise-values) values). Delay in ms between row batches.
| **<code>reporter</code>**<br>**<code>--reporter</code>** | | Produce a report of results. Valid values are `json`, `csv`, `xlsx` (see https://github.com/ply-ct/ply-viz for other formats). Especially useful with [rowwise](values#rowwise-values) values.
| **<code>maxLoops</code>**<br>**<code>--maxLoops</code>** | `10` | (When flows have loopback links). Max instance count per step. Overridable in flow design. 
| **<code>responseBodySortedKeys</code>**<br>**<code>--responseBodySortedKeys</code>** | `true` | Predictable ordering of response body JSON property keys in result files. Usually needed for verification.
| **<code>genExcludeResponseHeaders</code>**<br>**<code>--genExcludeResponseHeaders</code>** | `cache-control,`<br>`connection,`<br>`content-length,`<br>`date,`<br>`etag,`<br>`keep-alive,`<br>`server,` <br>`transfer-encoding`, <br>`x-powered-by` | Response headers to exclude when generating expected results.
| **<code>binaryMediaTypes</code>**<br>**<code>--binaryMediaTypes</code>** | `application/octet-stream,`<br>`image/png,`<br>`image/jpeg,`<br>`image/gif,`<br>`application/pdf` | Media types to be treated as binary responses. Base64 encoded in result yaml files.
| **<code>prettyIndent</code>**<br>**<code>--prettyIndent</code>** | `2` | JSON format indenting for response body content in result files.
