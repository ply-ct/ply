import * as fs from 'fs';
import * as path from 'path';
import { Reporter, ReportOptions } from '../runs/model';
import { Log } from '../logger';
import { Runs } from '../runs/runs';

export class HtmlReporter implements Reporter {
    constructor(readonly logger: Log) {}

    async report(options: ReportOptions) {
        // TODO template when run from vs-code
        const template = path.resolve(path.join(__dirname, '..', '..', 'templates', 'runs.html'));
        let html = await fs.promises.readFile(template, { encoding: 'utf-8' });

        const runs = new Runs(options.runsLocation);
        const plyResults = await runs.loadPlyResults();
        html = html.replace(
            '${overallResults}',
            `<pre>${JSON.stringify(plyResults.overall)}</pre>`
        );
        html = html.replace(
            '${suiteRuns}',
            `<pre>${JSON.stringify(plyResults.runs, null, 2)}</pre>`
        );

        await fs.promises.writeFile(`${options.outputLocation}/ply-runs.html`, html, {
            encoding: 'utf-8'
        });
    }
}
