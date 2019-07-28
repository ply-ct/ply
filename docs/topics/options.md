---
layout: topic
---
## Options

This javascript object shows the default values for each ply option.
These can be overridden programmatically in your tests by passing to the `run()` function:
```javascript
var options = {
  location: ./test,
  expectedResultLocation: './test/results/expected',
  resultLocation: './test/results/actual',
  debug: true,
  responseHeaders: ['content-type']
};

request.run(options, values)
```

### Option Values

| Name | Default |
| :----- | :------ |
| **debug** | `false` | Debug logging output
| **location** | `path.dirname(process.argv[1])` | File system location or URL |
| **expectedResultLocation** | `[location]/results/expected` | Expected results YAML |
| **resultLocation** | `[location]/results/actual` | Where to write actual results YAML |
| **logLocation** | (same as *resultLocation*) | Where logs are written |
| **localLocation** | (for ply-ui) | Logical path where overrides are saved in browser local storage |
| **extensions** | `[.request.yaml,postman_collection.json]` | Filename extensions for request files |
| **responseHeaders** | (all) | Array of validated response headers, in the order they'll appear in result YAML (omitted headers are ignored) |
| **formatResult** | `true` | Pretty-print and sort keys of JSON body content in results (for comparision vs expected) |
| **prettyIndent** | `2` | Pretty-print indentation |
| **retainLog** | `false` | Append to log for each test instead of overwriting |
| **captureResult** | `true` | Whether test results should be saved (false for pre-script cleanup, etc.) |
| **retainResult** | `false` | Append to result file instead of overwriting |
| **qualifyLocations** | `true` | Result and log paths prefixed by group (or can be string for custom) |
| **overwriteExpected** | `false` | Save actual result as expected result (for initial creation) |

