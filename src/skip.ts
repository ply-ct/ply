import { minimatch } from 'minimatch';
import { fwdSlashes } from './util';

export class Skip {
    private pattern: string;

    constructor(pattern: string) {
        this.pattern = fwdSlashes(pattern);
    }

    isSkipped(path: string): boolean {
        return minimatch(fwdSlashes(path), this.pattern);
    }
}
