---
layout: topic
---
# Configuration
Ply's configuration is defined in a file named plyconfig.yaml, plyconfig.yml, or plyconfig.json.
This config file is found at runtime by searching upward in the file system directory structure, starting from cwd.
Options specified as [command line](cli) arguments override values from the config file.

## Options
{% include_relative _options.md %}

### Ignored vs Skipped
Ignored files aren't regarded by Ply at all. To wit, they don't show up in vscode's Ply sidebar.
Skipped files are loaded but not executed. Some use cases for `skip`:
  - Standalone (.ply) requests are skipped by default. Typically these are mainly for ad hoc manual testing.
  - Requests that are only meant to be executed programmatically from within cases. In ply-demo's [plyconfig.yaml](https://github.com/ply-ct/ply-demo/blob/main/plyconfig.yaml), for example, movies-api.ply.yaml is skipped to prevent direct execution.

## VS Code Settings
Many options above are also configurable in VS Code settings once the [Ply extension](https://marketplace.visualstudio.com/items?itemName=ply-ct.vscode-ply) is installed. 
When running requests/flows/cases through the VS Code Ply extension, these user/workspace settings take precedence over values in plyconfig.yaml/yml/json.

Next Topic: [API](../api)
