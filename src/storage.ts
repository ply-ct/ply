import * as fs from 'fs';
import { Location } from './location';

/**
 * Abstracts storage to file system or html localStorage.
 */
export class Storage {

    readonly location: Location;
    private readonly localStorage: any;

    /**
     * @param location file or logical path
     */
    constructor(location: string) {
        this.location = new Location(location);

        if (typeof localStorage !== 'undefined') {
            this.localStorage = localStorage;
        }
    }


    get exists(): boolean {
        if (this.localStorage) {
            return this.localStorage.getItem(this.location.path) !== null;
        }
        else {
            return fs.existsSync(this.location.path);
        }
    }

    read(): string | undefined {
        if (this.localStorage) {
            return this.localStorage.getItem(this.location.path);
        }
        else {
            if (fs.existsSync(this.location.path)) {
                return fs.readFileSync(this.location.path, 'utf-8');
            }
        }
    }

    write(contents: string) {
        if (this.localStorage) {
            this.localStorage.setItem(this.location.path, contents);
        }
        else {
            require('mkdirp').sync(this.location.parent);
            fs.writeFileSync(this.location.path, contents);
        }
    }

    append(contents: string) {
        if (this.localStorage) {
            const exist = this.localStorage.getItem(this.location.path);
            this.localStorage.setItem(this.location.path, exist ? exist + contents : contents);
        }
        else {
            require('mkdirp').sync(this.location.parent);
            fs.appendFileSync(this.location.path, contents);
        }
    }

    remove() {
        if (this.localStorage) {
            this.localStorage.removeItem(this.location.path);
        }
        else {
            if (fs.existsSync(this.location.path)) {
                fs.unlinkSync(this.location.path);
            }
        }
    }

    toString(): string {
        return this.location.toString();
    }
}