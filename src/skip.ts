import { minimatch } from 'minimatch';

export class Skip {
    constructor(readonly pattern: string) {}

    isSkipped(path: string): boolean {
        return minimatch(path, this.pattern);
    }
}
