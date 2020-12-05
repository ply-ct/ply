## Contributing to Ply
We welcome your contributions to Ply whether they be fixes/enhancements, automated tests, documentation, bug reports or feature requests.

### Issues
  - Issues must have appropriate labels and a proposed milestone.

### Pull Requests
  - All commits are against an issue, and your comment should reference the issue it addresses: `Fix #<issue number>`
  - These labels are not included in release notes
    - internal
    - wontfix
    - duplicate
    - documentation

### Developer Setup
1. Prerequisites
   - IntelliJ IDEA Community Edition:                              
     https://www.jetbrains.com/idea/download/


2. Get the Source Code
   - Command-line Git:  
     `https://github.com/ply-ct/ply.git`

3. Set up npm (One-time step)
   - Install NodeJS:                                                                     
     https://docs.npmjs.com/getting-started/installing-node
   - Open a command prompt in the Ply-hub project directory
     ```
     npm install
     ```

4. Build in IntelliJ IDEA
   - Run IntelliJ IDEA Community Edition
   - Select Open Project and browse to Ply/Ply
   - In the Gradle tool window, execute the buildDev task.

5. Edit configuration files to suit local environment:
   - Ply/config/access.yaml (set devUser to yourself)


6. Run Spring Boot Jar in IntelliJ IDEA
   - From the IntelliJ menu select Run > Edit Configurations.
   - Click **+** > Jar Application.
   - For Path to Jar, browse to Ply/deploy/app/Ply-boot-6.1.XX-SNAPSHOT.jar
   - Save the configuration and type ctrl-alt-R to run/debug Ply.

7. PlyHub Web Development
   - To avoid having to reassemble the boot jar to test web content changes, add this to your IntelliJ run configuration:
     `-DPly.hub.dev.override.root=../Ply-hub/web`

8. Run the Tests
   - Access the autotest page in PlyHub:
     http://localhost:8080/Ply/#/tests
   - Use the Settings button to enable Stubbing and increase Threads to 10
   - Select all test cases, and execute

### Code Format
   - https://centurylinkcloud.github.io/Ply/docs/code/format/


### Documentation
1. Source
   - Documentation is in the docs directory of the master branch on GitHub
   - **Important:** When editing .md files in IntelliJ, to preserve trailing whitespace characters, install the Markdown plugin:
     - https://plugins.jetbrains.com/plugin/7793-markdown-support
     Do not commit changes to markdown files that remove trailing whitespace.
2. Local GitHub Pages
   - To test doc access before pushing, and to make changes to default layouts and styles, you can build through [Jekyll](https://help.github.com/articles/about-github-pages-and-jekyll/) locally.
   - Install Ruby 2.3.3 or higher and add its bin directory to your PATH.
   - Install Bundler:
     ```
     gem install bundler
     ```
   - Download the CURL CA Certs from http://curl.haxx.se/ca/cacert.pem and save in your Ruby installation directory.
   - Set environment variable SSL_CERT_FILE to point to this this cacert.pem file location.
   - Install Ruby DevKit: https://github.com/oneclick/rubyinstaller/wiki/Development-Kit
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
