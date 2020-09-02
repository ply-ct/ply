import { Retrieval } from './retrieval';
import { Location } from './location';
import { Storage } from './storage';
import { Logger } from './logger';
import * as yaml from './yaml';

export type ImportFormat = 'postman';

export class Import {

    constructor(
        readonly format: ImportFormat,
        readonly root: string,
        readonly logger: Logger,
        readonly indent: number
    ) { }

    async doImport(retrieval: Retrieval): Promise<void> {
        const from = await retrieval.read();
        if (!from) {
            throw new Error(`Import source not found: ${retrieval.location}`);
        }
        switch(this.format) {
            case 'postman': {
                new Postman(this.root, this.logger, this.indent).import(from);
            }
        }

    }
}

export interface Importer {
    import(from: string): Promise<void>;
}

interface Request {
    url: string;
    method: string;
    headers: {[key: string]: string};
    body?: string;
}

export class Postman implements Importer {

    private storagePathToRequestsObj = new Map<string,{[key: string]:Request}>();

    constructor(
        readonly root: string,
        readonly logger: Logger,
        readonly indent: number
    ) { }

    async import(from: string): Promise<void> {
        const obj = JSON.parse(from);
        this.storagePathToRequestsObj.clear();
        if (obj.values) {
            const values: any = {};
            for (const value of obj.values) {
                if (value.enabled) {
                    values[value.key] = value.value;
                }
            }
            // TODO save values
        } else if (obj.item) {
            // requests
            let name = new Location(from).name;
            const dot = name.lastIndexOf('.');
            if (dot > 0) {
                name = name.substring(0, dot);
            }
            this.processItem(`${this.root}/${name}`, obj.item);
            for (const [path, requestsObj] of this.storagePathToRequestsObj) {
                const storage = new Storage(path);
                if (storage.exists) {
                    this.logger.info(`Overwritng: ${storage}`);
                } else {
                    this.logger.info(`Creating: ${storage}`);
                }
                storage.write(yaml.dump(requestsObj, this.indent));
            }
        }
    }

    private processItem(path: string, item: any[]) {
        for (const it of item) {
            if (it.request) {
                // write the request
                const name = it.name as string;
                try {
                    const request = this.translateRequest(it.request);
                    const storagePath = `${path}.ply.yaml`;
                    const reqsObj = this.storagePathToRequestsObj.get(storagePath);
                    if (reqsObj) {
                        reqsObj[name] = request;
                    } else {
                        this.storagePathToRequestsObj.set(storagePath, { [name]: request });
                    }
                } catch (err) {
                    this.logger.error(`Request ${path}/${it.name} not imported due to: ${err.message}`);
                    this.logger.debug(err.message, err);
                }
            }
            if (it.item) {
                this.processItem(`${path}/${it.name}`, it.item);
            }
        }
    }

    private translateRequest(postmanRequest: any): Request {
        const request: Request = {
            url: postmanRequest.url.raw,
            method: postmanRequest.method,
            headers: {}
        };
        if (postmanRequest.header) {
            for (const head of postmanRequest.header) {
                request.headers[head.key] = head.value;
            }
        }
        if (postmanRequest.body) {
            if (typeof postmanRequest.body === 'string') {
                request.body = postmanRequest.body;
            } else {
                const mode = postmanRequest.body.mode;
                if (mode === 'graphql') {
                    request.body = postmanRequest.body.graphql;
                } else if (mode === 'raw') {
                    request.body = postmanRequest.body.raw;
                } else {
                    throw new Error(`Unsupported request body mode: ${postmanRequest.body.mode}`);
                }
            }
        }
        return request;
    }
}