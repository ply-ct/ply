import * as fs from 'fs';

/**
 * Abstracts storage to file system or html localStorage.
 */
export class Storage {

    /**
     * Points to a file or logical file path in localStorage.
     */
    readonly path: string;
    private readonly localStorage: any;

    /**
     *
     * @param location directory or logical path
     * @param name filename or logical
     */
    constructor(readonly location: string, readonly name: string) {
        if (typeof localStorage === 'undefined') {
            this.name = this.namify(this.name);
            require('mkdirp').sync(this.location);
        }
        else {
            this.localStorage = localStorage;
        }
        this.path = this.location;
        if (this.name) {
            this.path += '/' + this.name;
        }
    }

    get exists(): boolean {
        if (this.localStorage) {
            return this.localStorage.getItem(this.path) !== null;
        }
        else {
            return fs.existsSync(this.path);
        }
    }

    read(): string | undefined {
        if (this.localStorage) {
            return this.localStorage.getItem(this.path);
        }
        else {
            var contents;
            if (fs.existsSync(this.path)) {
                contents = fs.readFileSync(this.path, 'utf-8');
            }
            return contents;
        }
    }

    write(contents: string) {
        if (this.localStorage) {
            this.localStorage.setItem(this.path, contents);
        }
        else {
            fs.writeFileSync(this.path, contents);
        }
    }

    append(contents: string) {
        if (this.localStorage) {
            const exist = this.localStorage.getItem(this.path);
            this.localStorage.setItem(this.path, exist ? exist + contents : contents);
        }
        else {
            fs.appendFileSync(this.path, contents);
        }
    }

    remove() {
        if (this.localStorage) {
            this.localStorage.removeItem(this.path);
        }
        else {
            if (fs.existsSync(this.path))
                fs.unlinkSync(this.path);
        }
    }

    namify(name: string): string {
        const orig = name;
        let result = require('filenamify')(name, { replacement: '_' });
        return orig.startsWith('.') ? '.'+ result : result;
    }

    toString(): string {
        return this.path;
    }


}