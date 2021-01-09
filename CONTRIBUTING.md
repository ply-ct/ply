## Contributing to Ply
We welcome your contributions to Ply whether they be fixes/enhancements, automated tests, documentation, bug reports or feature requests.

### Issues
  - Issues must have appropriate labels and a concise description of the concern.

### Pull Requests
  - All pull requests are against an issue, and your squashed commit message should reference the issue it addresses, eg: `Fix #<issue number>`

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

### Serve Documentation Locally
1. Source
   - Documentation is in the docs directory of the master branch on GitHub
     Do not commit changes to markdown files that remove trailing whitespace.
2. Local GitHub Pages
   - To test doc access before pushing, and to make changes to default layouts and styles, 
     you can build through [Jekyll](https://help.github.com/articles/about-github-pages-and-jekyll/) locally.
   - [Install Ruby](https://www.ruby-lang.org/en/documentation/installation/) and add its bin directory to your PATH.
     Ruby comes pre-installed on macOS.
   - Install bundler gem:
     ```
     gem install bundler
     ```
   - Serve GitHub pages locally:
     ```
     npm run serve-docs
     ```
   - Access in your browser:
     http://127.0.0.1:4000/
