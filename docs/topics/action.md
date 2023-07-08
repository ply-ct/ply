---
layout: topic
---
# GitHub Action
The [Ply GitHub Action](https://github.com/ply-ct/ply-action) executes your autotests and optionally displays a badge 
![ply success](https://ply-ct.org/ply/badge/passing.svg) indicating success or failure.

## Example workflow file
```yaml
jobs:
  ply:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v3
    - uses: actions/setup-node@v3
      with:
        node-version: '16.x'
    - run: npm install
    - uses: ply-ct/ply-action@v2
```
This example runs all Ply tests and fails if they don't succeed.

## Ply results badge
A Ply badge can easily be added to public repositories, like this example from [ply-demo](https://github.com/ply-ct/ply-demo):
```markdown
![ply badge](https://ply-ct.org/badges/ply-ct/ply-demo/workflows/build?)
<!-- substitute your [owner]/[repository] -->
```
In fact, ply-action is not even required for this feature. The badge URL above follows the
same pattern as [GitHub workflow status badges](https://docs.github.com/en/actions/managing-workflow-runs/adding-a-workflow-status-badge).
The standard GitHub badge URL for ply-demo's workflow is `https://github.com/ply-ct/ply-demo/workflows/build/badge.svg`,
whereas to display a Ply badge for the same workflow the URL is `https://ply-ct.org/badges/ply-ct/ply-demo/workflows/build`.
Basically the same path (`<owner>/<repository>/workflows/<workflow_name>`). This works for public repositories because Ply is
able to retrieve their workflow build status. The question mark at the end of the URL is to prevent overly-aggressive GitHub CDN caching.

## Private repositories
Private repositories can use ply-action as in the example above, but to include a badge some additional configuration is needed:
```yaml
    - uses: ply-ct/ply-action@v2
      with: 
        github-token: ${{ secrets.MY_GITHUB_TOKEN }}
        badge-branch: badge
        badge-path: ply-badge.svg
```
This directs ply-action to commit and push the current status badge to the ([orphan](https://git-scm.com/docs/git-checkout#Documentation/git-checkout.txt---orphanltnewbranchgt)) 
branch named 'badge'. It's orphanness keeps the branch clean. No need to create the branch ahead of time. Once you've executed the workflow, its
Ply badge can be referenced from your own repository:
```markdown
![ply badge](https://github.com/<owner>/<repository>/blob/badge/ply-badge.svg)
```

## External execution
If you've already integrated Ply CLI commands into a GitHub workflow (say with code coverage metrics), you may prefer to
skip Ply test execution altogether, and use ply-action simply to perform a badge commit based on the results of previous Ply CLI run.
In that case, specify the path to an overall Ply results file created using the `--resultFile` [CLI arg](https://ply-ct.org/ply/topics/config):
```yaml
    - uses: ply-ct/ply-action@v2
      with: 
        ply-path: node_modules/ply-ct/dist
        result-file: test/api/results/actual/ply-results.json        
        github-token: ${{ secrets.MY_GITHUB_TOKEN }}
        badge-branch: badge
        badge-path: ply-badge.svg
```

## Inputs

| Name         | Default                  | Description                                                                                           |
| :----------- | :------------------------| :-----------------------------------------------------------------------------------------------------|
| plyees       | (all ply tests)          | Glob pattern(s) for requests/flows/cases                                                              |
| cwd          | .                        | Working directory for ply execution                                                                   |
| ply-path     | (embedded ply)           | Path to ply package when installed as dependency (eg: node_modules/@ply-ct/ply/dist)                  |
| result-file  |                          | Result file in case Ply tests were already run in a previous workflow/job                             |
| badge-branch |                          | Branch to contain status badge (eg: "badge"). Needed to display Ply badge for private repositories.   |
| badge-path   | ply-badge.svg            | Save badge to this file path (relative to repo root). Only used with badge-branch.                    |
| github-token |                          | GitHub token for pushing badge updates. Required if badge-branch input is specified.                  |

<br>
Next Topic: [Testkube](testkube)
