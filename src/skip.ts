import * as glob from 'glob';
import { Location } from './location';

export class Skip {
    /**
     * Absolute paths (always forward slashes).
     */
    skipped: string[];

    constructor(readonly path: string, readonly pattern: string) {
        this.skipped = glob
            .sync(pattern, {
                cwd: new Location(path).absolute
            })
            .map((skip) => new Location(skip).absolute);
    }

    isSkipped(path: string): boolean {
        return this.skipped.includes(new Location(path).absolute);
    }
}
