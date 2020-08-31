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
Then you should run ply in your project directory through `npx`:
```
npx ply --version
```
The exercises in this guide assume you have Ply installed globally. If instead
you've installed as a dev dependency, adjust the example commands accordingly.
<hr style="margin-top:10px">
## ply-movies
Most of these exercises use the [ply-movies](https://github.com/ply-ct/ply-movies#readme) sample API.
Once you've cloned [ply-demo](https://github.com/ply-ct/ply-demo), you can start and stop the movies 
server as a background process through npm scripts:
```
git clone https://github.com/ply-ct/ply-demo.git
cd ply-demo
npm install

npm run start-movies
# <run some tests>
npm run stop-movies
```
You could also choose to install ply-movies globally, and start the server in a separate command window:
```
npm install -g ply-movies
ply-movies start
```
In that case you'd shut it down using `ctrl-c` once you're done testing.
<div style="height:10px"></div>

Next Topic: [VS Code Ply](vscode-ply)