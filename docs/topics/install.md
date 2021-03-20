---
layout: topic
---
# Installation

## Node.js
This is a prerequisite for installing Ply.
1. Install Node.js:
   <https://nodejs.org/en/download/>

## VS Code Extension
Use Ply interactively through [VS Code](https://code.visualstudio.com/).
1. Install Visual Studio Code:
   <https://code.visualstudio.com/download>
1. Install the Ply VS Code extension:
   - Run Visual Studio Code
   - In the Activity Bar on the left, click the Extensions icon: 
     <img src="../img/extensions.png" alt="Extensions Icon" class="icon-img">
   - Search for "Ply", and click its `Install` button.
   - Restart VS Code after installing Ply.

## Command Line Interface
Install Ply through [npm](https://www.npmjs.com/package/ply-ct) to use the CLI.
1. Global
   ```
   npm install -g ply-ct
   ```
   This way you can run `ply` directly from the command line:
   ```
   ply --version
   ```
1. Dev Dependency
   ```
   npm install --save-dev ply-ct
   ```
   Then you can run ply in your project directory through `npx`:
   ```
   npx ply --version
   ```
Command-line exercises in this guide assume you have Ply installed globally.

Next Topic: [Getting Started](intro)