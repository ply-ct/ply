import * as os from 'os';
import * as fs from 'fs';
import { Reporter, ReportOptions } from '../runs/model';
import { Runs } from '../runs/runs';
import { ReportData } from './data';
import { timestamp } from '../util';

export class SheetReporter implements Reporter {
    constructor() {}

    /**
     * TODO xlsx
     */
    async report(options: ReportOptions) {
        const runs = new Runs(options.runsLocation);
        const suiteRuns = await runs.loadSuiteRuns();
        const dataColumns = new ReportData(suiteRuns).dataColumns;
        const labels = Object.keys(dataColumns);
        const rows = [labels.join(',')];
        const dataRowCount = dataColumns[labels[0]].length;
        for (let i = 0; i < dataRowCount; i++) {
            const row: string[] = [];
            for (const label of labels) {
                let val = dataColumns[label][i];
                if (val === null) {
                    val = '';
                } else if (val instanceof Date) {
                    val = timestamp(val).replace(/,/g, '');
                }
                row.push(`${val}`);
            }
            rows.push(row.join(','));
        }
        const csv = rows.join(os.EOL);
        options.logger.info(`Writing file: ${options.output}`);
        await fs.promises.writeFile(options.output, csv, { encoding: 'utf-8' });
    }
}
