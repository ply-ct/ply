import * as fs from 'fs';
import { isAbsolute, join } from 'path';
import { Reporter } from '../runs/model';
import { JsonReporter } from './json';
import { SheetReporter } from './sheet';

export class ReporterFactory {
    constructor(public format: string) {}

    async createReporter(): Promise<Reporter> {
        switch (this.format) {
            case 'json': {
                return new JsonReporter();
            }
            case 'csv':
            case 'xlsx': {
                return new SheetReporter();
            }
            default: {
                const hash = this.format.indexOf('#');
                if (hash <= 0 || hash >= this.format.length - 1) {
                    throw new Error(`Unsupported reporter format: ${this.format}`);
                }
                let modFile = this.format.substring(0, hash);
                if (!isAbsolute(modFile)) {
                    modFile = join(process.cwd(), modFile);
                }
                if (!fs.existsSync(modFile)) {
                    throw new Error(`Reporter not found at: ${modFile}`);
                }
                const mod = await import(modFile);
                this.format = this.format.substring(hash + 1);
                const reporter = mod[this.format];
                if (!reporter) {
                    throw new Error(`Reporter not found: ${this.format}`);
                }
                if (typeof reporter.report !== 'function') {
                    throw new Error(`Invalid reporter: ${this.format}`);
                }
                return reporter;
            }
        }
    }
}
