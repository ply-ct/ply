import * as fs from 'fs';
import { Reporter, ReportOptions } from '../runs/model';
import { Log } from '../logger';
import { Runs } from '../runs/runs';

export class JsonReporter implements Reporter {
    constructor(readonly logger: Log) {}

    async report(options: ReportOptions) {
        const runs = new Runs(options.runsLocation);
        const plyResults = await runs.loadPlyResults();
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
