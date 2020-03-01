/**
 * Abstraction for a URL or file location.
 */
export class Location {

    readonly path: string;
    private readonly lastSlash?: number;

    /**
     * @param path url or file path (backslashes are replaced with slashes)
     */
    constructor(path: string) {
        this.path = path.replace(/\\/g, '/');
        const ls = this.path.lastIndexOf('/');
        if (ls !== -1) { this.lastSlash = ls; }
    }

    /**
     * Undefined if no parent path
     */
    get parent(): string | undefined {
        if (this.lastSlash) {
            return this.path.substr(0, this.lastSlash);
        }
    }

    get name(): string {
        return this.lastSlash ? this.path.substring(this.lastSlash + 1) : this.path;
    }

    get base(): string {
        const name = this.name;
        const lastDot = name.lastIndexOf('.');
        if (lastDot > 0 && lastDot < name.length - 1) {
            return name.substring(lastDot + 1);
        }
        else {
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

    get isYaml(): boolean {
        return this.ext === 'yaml' || this.ext === 'yml';
    }

    get isUrl(): boolean {
        return this.path.startsWith('https://') || this.path.startsWith('http://');
    }

    toString(): string {
        return this.path;
    }

}