import * as fs from 'fs';
import { Reporter, ReportOptions } from './model';
import { Log } from '../logger';
import { loadSuiteRuns } from './report';

export class JsonReporter implements Reporter {
    constructor(readonly logger: Log) {}

    async report(options: ReportOptions) {
        const plyResults = await loadSuiteRuns(options.runsLocation);
        plyResults.runs.forEach((sr) => {
            if (sr.start) sr.start = sr.start.toISOString() as any;
            if (sr.end) sr.end = sr.end.toISOString() as any;
        });
        const runsContent = JSON.stringify(plyResults, null, options.indent);
        await fs.promises.writeFile(`${options.outputLocation}/ply-runs.json`, runsContent, {
            encoding: 'utf-8'
        });
    }
}
