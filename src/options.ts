import * as fs from 'fs';

export interface Options {
    /**
     * verbose output
     */
    verbose: boolean;
    /**
     * bail on first failure
     */
    bail: boolean;
    /**
     * tests base directory
     */
    testsLocation: string;
    /**
     * expected results base dir
     */
    expectedLocation: string;
    /**
     * actual results base dir
     */
    actualLocation: string;
    /**
     * log location
     */
    /**
     * request file(s) glob patterns
     */
    requestFiles: string[];
    /**
     * case files(s) glob patterns
     */
    caseFiles: string[];
    /**
     * prettify response body (needed for comparison)
     */
    formatResponseBody: boolean;
    /**
     * prettification indent
     */
    responseBodyIndent: number;
    /**
     * retain log
     */
    retainLog: boolean;
    /**
     * capture result
     */
    captureResult: boolean;
    /**
     * retain result
     */
    retainResult: boolean;
    /**
     * response headers
     */
    responseHeaders: string[];
}

export class Options {
    verbose = false;
    bail = false;
    testsLocation = '.';
    expectedLocation = this.testsLocation + '/results/expected';
    actualLocation = this.testsLocation + '/results/actual';
    requestFiles = ['**/*.ply.yaml', '**/*.ply.yml'];
    caseFiles = ['**/*.ply.ts', '**/*.ply.js'];
    formatResponseBody = true;
    responseBodyIndent = 2;
    retainLog = false;
    captureResult = true;
    retainResult = false;
    responseHeaders = ['content-type'];


}

export class Config {

    private loadRc(): Options | undefined {
        const rc = this.getRc();
        if (rc) {
            var contents = fs.readFileSync(rc);
            if (rc.endsWith('.json')) {

            } else {

            }
        }
    }

    private getRc(): string | undefined {
        if (fs.existsSync('.plyrc.yml')) {
            return '.plyrc.yml';
        } else if (fs.existsSync('.plyrc.yaml')) {
            return '.plyrc.yaml';
        } else if (fs.existsSync('.plyrc.json')) {
            return '.plyrc.json';
        }
    }

}