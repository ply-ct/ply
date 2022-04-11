import { Reporter, ReportFormat } from '../runs/model';
import { Log } from '../logger';
import { JsonReporter } from './json';
import { HtmlReporter } from './html';
import { CsvReporter } from './csv';

export class Report {
    constructor(readonly format: ReportFormat, readonly logger: Log) {}

    createReporter(): Reporter {
        switch (this.format) {
            case 'json': {
                return new JsonReporter(this.logger);
            }
            case 'csv': {
                return new CsvReporter(this.logger);
            }
            // case 'xlsx': {
            //     return new XlsxReporter(this.logger);
            // }
            case 'html': {
                return new HtmlReporter(this.logger);
            }
        }
    }
}
