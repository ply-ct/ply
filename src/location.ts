import * as fs from 'fs';
import * as path from 'path';
import { fwdSlashes } from './util';

/**
 * Abstraction for a URL or file location.
 */
export class Location {
    readonly path: string;

    /**
     * @param path url or file path (backslashes are replaced with slashes)
     */
    constructor(path: string) {
        this.path = fwdSlashes(path);
        if (this.path.endsWith('/')) {
            this.path = this.path.substring(0, this.path.length - 1);
        }
    }

    private get lastSlash(): number | undefined {
        const ls = this.path.lastIndexOf('/');
        if (ls !== -1) {
            return ls;
        }
    }

    /**
     * Undefined if no parent path
     */
    get parent(): string | undefined {
        if (this.lastSlash) {
            return this.path.substring(0, this.lastSlash);
        }
    }

    get name(): string {
        return this.lastSlash ? this.path.substring(this.lastSlash + 1) : this.path;
    }

    /**
     * Name without extension
     */
    get base(): string {
        const name = this.name;
        const lastDot = name.lastIndexOf('.');
        if (lastDot > 0 && lastDot < name.length - 1) {
            return name.substring(0, lastDot);
        } else {
            return name;
        }
    }

    get ext(): string | undefined {
        const name = this.name;
        const lastDot = name.lastIndexOf('.');
        if (lastDot > 0 && lastDot < name.length - 1) {
            return name.substring(lastDot + 1);
        }
    }

    /**
     * Returns zero for URLs, undefined if file does not exist
     */
    get timestamp(): number | undefined {
        if (this.isUrl) {
            return 0;
        } else if (fs.existsSync(this.path)) {
            return fs.statSync(this.path).mtimeMs;
        }
    }

    get isYaml(): boolean {
        return this.ext === 'yaml' || this.ext === 'yml';
    }

    get scheme(): string | undefined {
        if (this.path.startsWith('https://')) {
            return 'https';
        } else if (this.path.startsWith('http://')) {
            return 'http';
        }
    }

    get isUrl(): boolean {
        return !!this.scheme;
    }

    get isAbsolute(): boolean {
        return this.isUrl || path.isAbsolute(this.path);
    }

    get absolute(): string {
        if (this.isUrl) {
            return this.path;
        } else {
            return fwdSlashes(path.normalize(path.resolve(this.path)));
        }
    }

    /**
     * TODO: handle urls
     */
    isChildOf(parent: string): boolean {
        const relative = this.relativeTo(parent);
        return relative.length > 0 && !relative.startsWith('..') && !path.isAbsolute(relative);
    }

    /**
     * TODO: handle urls
     */
    relativeTo(parent: string): string {
        return fwdSlashes(path.normalize(path.relative(parent, this.path)));
    }

    toString(): string {
        return this.path;
    }
}
