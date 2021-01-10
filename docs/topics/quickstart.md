---
layout: topic
---
## Ply Flows Quickstart
If you want to get straight to building Ply test flows in less than 10 minutes, this guide is for you.
If you already know your way around npm and vscode, you may want to skip to [Install Ply](install-ply) 
or [VS Code Ply](vscode-ply).

## Prerequisites
1. Install Node.js:
   <https://nodejs.org/en/download/>
1. Install Git:
   <https://git-scm.com/downloads>
1. Install Visual Studio Code:
   <https://code.visualstudio.com/download>
1. Install the Ply VS Code extension:
   - Run Visual Studio Code
   - In the Activity Bar on the left, click the Extensions icon: 
     <img src="../img/extensions.png" alt="Extensions Icon" width="30px" style="position:absolute;margin-left:5px;margin-top:-5px;">
   - Search for "Ply", and click its `Install` button.

## Open the ply-demo project
1. Click the Explorer icon in VS Code's Activity Bar:
   <img src="../img/explorer.png" alt="Explorer Icon" width="30px" style="position:absolute;margin-left:5px;margin-top:-5px;">
1. Click the button that says `Clone Repository`
1. Paste the ply-demo repository URL: {% include copy_to_clipboard.html text="https://github.com/ply-ct/ply-demo.git" %}

## Create a new test flow
1. In the Activity Bar, click on the Test Explorer icon:
   <img src="../img/test-explorer.png" alt="Text Explorer Icon" width="30px" style="position:absolute;margin-left:5px;margin-top:-5px;">
1. Expand the Flows group, right-click on "test/flows", and select New Ply Flow.
1. Name the flow "github-api.ply.flow".
1. Test Entry - Try Again - FINAL CHANGE

Next Topic: [Flows](flows)