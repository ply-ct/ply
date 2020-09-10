import * as fs from 'fs';
import * as os from 'os';
import * as mkdirp from 'mkdirp';
import * as util from './util';
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

    /**
     * For file system storage, all newlines are replaced with OS-appropriate
     */
    write(contents: string) {
        if (this.localStorage) {
            this.localStorage.setItem(this.location.path, contents);
        }
        else {
            if (this.location.parent) {
                mkdirp.sync(this.location.parent);
            }
            fs.writeFileSync(this.location.path, contents.replace(/\r?\n/, os.EOL));
        }
    }

    /**
     * For file system storage, all newlines are replaced with OS-appropriate
     */
    append(contents: string) {
        if (this.localStorage) {
            const exist = this.localStorage.getItem(this.location.path);
            this.localStorage.setItem(this.location.path, exist ? exist + contents : contents);
        }
        else {
            if (this.location.parent) {
                mkdirp.sync(this.location.parent);
            }
            fs.appendFileSync(this.location.path, contents.replace(/\r?\n/, os.EOL));
        }
    }

    insert(contents: string, start: number) {
        let newLines = util.lines(contents);
        const exist = this.read();
        if (exist) {
            const existLines = util.lines(exist);
            const preLines = start > 0 ? existLines.slice(0, start) : [];
            const postLines = existLines.slice(start);
            newLines = [ ...preLines, ...newLines, ...postLines ];
        }
        this.write(newLines.join('\n'));
    }

    padLines(start: number, lines: number) {
        this.insert(''.padStart(lines - 1, '\n'), start);
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