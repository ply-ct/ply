import fetch from 'cross-fetch';
import { Location } from './location';
import { Storage } from './storage';

/**
 * Abstracts retrieval from either URL or {@link Storage}.
 */
export class Retrieval {

    readonly location: Location;

    /**
     * @param location file path or url (backslashes are replaced with slashes)
     */
    constructor(location: string) {
        this.location = new Location(location);
    }

    async read(): Promise<string | undefined> {
        if (this.storage) {
            return Promise.resolve(this.storage.read());
        }
        else {
            const response = await fetch(this.location.path);
            return await response.text();
        }
    }

    sync(): string | undefined {
        if (this.storage) {
            return this.storage.read();
        }
        else {
            throw new Error('Retrieval.sync() not supported for remote path: ' + this);
        }
    }

    get exists(): Promise<boolean> {
        if (this.storage) {
            return Promise.resolve(this.storage.exists);
        } else {
            try {
                return fetch(this.location.path, { method: 'HEAD' })
                .then((response: Response) => {
                    return Promise.resolve(response.ok);
                });
            } catch {
                return Promise.resolve(false);
            }
        }
    }

    write(contents: string) {
        if (this.storage) {
            this.storage.write(contents);
        } else {
            throw new Error('Retrieval.write() not supported for remote path: ' + this);
        }
    }

    append(contents: string) {
        if (this.storage) {
            this.storage.append(contents);
        } else {
            throw new Error('Retrieval.append() not supported for remote path: ' + this);
        }
    }

    remove() {
        if (this.storage) {
            this.storage.remove();
        } else {
            throw new Error('Retrieval.remove() not supported for remote path: ' + this);
        }
    }

    toString(): string {
        return this.location.toString();
    }

    get storage(): Storage | undefined {
        if (!this.location.isUrl) {
            return new Storage(this.location.path);
        }
    }
}