import { Storage } from './storage';

/**
 * Abstracts retrieval from either URL or {@link Storage}.
 */
export class Retrieval {

    readonly path: string;
    private readonly storage?: Storage;
    private readonly fetch: any;

    constructor(readonly location: string, readonly name: string) {
        if (this.isRemote) {
            if (typeof window === 'undefined') {
                this.fetch = require('node-fetch');
            }
            else {
                this.fetch = window.fetch;
            }
        }
        else {
            this.storage = new Storage(this.location, this.name!);
        }

        this.path = this.location;
        if (this.name) {
            this.path += '/' + this.name;
        }
    }

    read(): Promise<string | undefined> {
        if (this.storage) {
            return Promise.resolve(this.storage.read());
        }
        else {
            return this.fetch(this.path)
            .then((response: Response) => {
                return response.text();
            });
        }
    }

    get exists(): Promise<boolean> {
        if (this.storage) {
            return Promise.resolve(this.storage.exists);
        }
        else {
            try {
                return this.fetch(this.path, { method: 'HEAD' })
                .then((response: Response) => {
                    return Promise.resolve(response.ok);
                });
            } catch {
                return Promise.resolve(false);
            }
        }
    }

    get isRemote(): boolean {
        return this.location.startsWith('https://') || this.location.startsWith('http://');
    }

    get isYamlExt(): boolean {
        return this.ext === '.yaml' || this.ext === '.yml';
    }

    get base(): string {
        const lastDot = this.name.lastIndexOf('.');
        if (lastDot > 0 && lastDot < this.name.length - 1) {
            return this.name.substring(0, lastDot);
        } else {
            return this.name;
        }
    }

    get ext(): string | undefined {
        const lastDot = this.name.lastIndexOf('.');
        if (lastDot > 0 && lastDot < this.name.length - 1) {
            return this.name.substring(lastDot + 1);
        }
    }

    toString(): string {
        if (this.storage) {
            return this.storage.toString();
        }
        else {
            return this.path;
        }
    }
}