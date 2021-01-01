## Contributing to Ply
We welcome your contributions to Ply whether they be fixes/enhancements, automated tests, documentation, bug reports or feature requests.

### Issues
  - Issues must have appropriate labels and a concise description of the concern.

### Pull Requests
  - All pull requests are against an issue, and your commit message should reference the issue it addresses, eg: `Fix #<issue number>`
  - These labels are not included in release notes
    - internal
    - wontfix
    - duplicate
    - documentation

### Developer Setup
1. Source Code
   - Command-line Git:  
     `https://github.com/ply-ct/ply.git`
1. NodeJS
   - Install NodeJS:                                                                     
     https://docs.npmjs.com/getting-started/installing-node
   - Open a command prompt in the Ply-hub project directory
     ```
     npm install
     ```
1. Run the Tests
   - mocha:
     ```
     npm run test
     ```

### Documentation
1. Source
   - Documentation is in the docs directory of the master branch on GitHub
     Do not commit changes to markdown files that remove trailing whitespace.
2. Local GitHub Pages
   - To test doc access before pushing, and to make changes to default layouts and styles, you can build through [Jekyll](https://help.github.com/articles/about-github-pages-and-jekyll/) locally.
   - Install Ruby and add its bin directory to your PATH.
   - Install Bundler:
     ```
     gem install bundler
     ```
   - Install Jekyll and all its dependencies (in the docs directory):
     ```
     bundle install
     ```
   - Build GitHub pages site locally (in the docs directory):
     ```
     bundle exec jekyll serve --incremental --watch --baseurl ''
     ```
   - Access locally in your browser:
     http://127.0.0.1:4000/
