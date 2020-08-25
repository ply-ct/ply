# Ply
![GitHub Workflow Status](https://img.shields.io/github/workflow/status/ply-ct/ply/ply%20ci)

## REST API Automated Testing

## Contents
  - [Installation](#installation)
  - [Usage](#usage)
  - [Demo](#demo)
  - [Documentation](#documentation)
  - [VS Code Extension](#vs-code-extension)

## Installation
```sh
npm install ply-ct --save-dev
```
Or, to run from anywhere:
```sh
npm install -g ply-ct
```

## Usage
Ply API testing starts with a YAML file containing requests. Here's a GET request to retrieve
topics for the [ply-demo](https://github.com/ply-ct/ply-demo) repository using the 
[GitHub API](https://developer.github.com/v3/repos/#get-all-repository-topics):
```yaml
repositoryTopics:
  url: 'https://api.github.com/repos/ply-ct/ply-demo/topics'
  method: GET
  headers:
    Accept: application/vnd.github.mercy-preview+json
```
Suppose you saved this in a file named "github.ply.yml". Then you'd be able to submit the
`repositoryTopics` request by typing:
```sh
ply -x github.ply.yml
```
The `-x` argument tells Ply not to validate the response (`-x` is short for `--exercise`, 
meaning submit an ad hoc request and don't bother with verification).


## Demo
TODO

## Documentation
TODO  
https://ply-ct.github.io/ply/topics/requests

## VS Code Extension
TODO  
https://github.com/ply-ct/vscode-ply



