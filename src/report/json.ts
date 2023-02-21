import * as fs from 'fs';
import { Reporter, ReportOptions } from '../runs/model';
import { Runs } from '../runs/runs';

export class JsonReporter implements Reporter {
    constructor() {}

    async report(options: ReportOptions) {
        const runs = new Runs(options.runsLocation);
        const plyResults = await runs.loadPlyResults();
        plyResults.runs.forEach((sr) => {
            if (sr.start) sr.start = sr.start.toISOString() as any;
            if (sr.end) sr.end = sr.end.toISOString() as any;
        });
        const runsContent = JSON.stringify(plyResults, null, options.indent);
        options.logger.info(`Writing file: ${options.output}`);
        await fs.promises.writeFile(options.output, runsContent, { encoding: 'utf-8' });
    }
}
