---
layout: topic
---
## Install Ply
There are two ways to install Ply:

## 1. Global
```
npm install -g ply-ct
```
This way you can run `ply` directly from the command line:
```
ply --version
```
## 2. Dev Dependency
```
npm install --save-dev ply-ct
```
Then you can run ply in your project directory through `npx`:
```
npx ply --version
```
The exercises in this guide assume you have Ply installed globally. If instead
you've installed only as a project dev dependency, adjust the example commands accordingly.

Next Topic: [VS Code Ply](vscode-ply)