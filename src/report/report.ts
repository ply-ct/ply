import { Reporter, ReportFormat } from '../runs/model';
import { Log } from '../logger';
import { JsonReporter } from './json';
import { HtmlReporter } from './html';
import { SheetReporter } from './sheet';
import { ImageReporter } from './image';

export class Report {
    constructor(readonly format: ReportFormat, readonly logger: Log) {}

    createReporter(): Reporter {
        switch (this.format) {
            case 'json': {
                return new JsonReporter(this.logger);
            }
            case 'csv':
            case 'xlsx': {
                return new SheetReporter(this.logger);
            }
            case 'png':
            case 'svg':
            case 'pdf': {
                return new ImageReporter(this.logger);
            }
            case 'html': {
                return new HtmlReporter(this.logger);
            }
        }
    }
}
