import ignoreWalk = require('ignore-walk');
import { Location } from './location';

export class PlyIgnore {

    /**
     * Absolute root path
     */
    root: string;
    /**
     * Absolute paths (always forward slashes).
     */
    includes: string[];

    constructor(readonly path: string) {
        this.root = new Location(path).absolute;
        this.includes = ignoreWalk.sync({
            path: new Location(this.root).absolute,
            ignoreFiles: ['.plyignore']
        }).map(include => new Location(include).absolute);
    }

    isIncluded(path: string): boolean {
        return !!this.includes.includes(new Location(path).absolute);
    }

    isExcluded(path: string): boolean {
        return !this.isIncluded(path);
    }
}