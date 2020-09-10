import { Retrieval } from './retrieval';
import { Location } from './location';
import { Storage } from './storage';
import { Log } from './logger';
import * as yaml from './yaml';

export type ImportFormat = 'postman';

export class Import {

    constructor(
        readonly format: ImportFormat,
        readonly root: string,
        readonly indent: number,
        readonly logger: Log
    ) { }

    async doImport(retrieval: Retrieval): Promise<void> {
        switch(this.format) {
            case 'postman': {
                await new Postman(this.root, this.indent, this.logger).import(retrieval);
            }
        }
    }
}

export interface Importer {
    import(from: Retrieval): Promise<void>;
}

interface Request {
    url: string;
    method: string;
    headers?: {[key: string]: string};
    body?: string;
}

export class Postman implements Importer {

    private storagePathToRequestsObj = new Map<string,{[key: string]:Request}>();

    constructor(
        readonly root: string,
        readonly indent: number,
        readonly logger: Log
    ) { }

    async import(from: Retrieval): Promise<void> {
        const contents = await from.read();
        if (!contents) {
            throw new Error(`Import source not found: ${from.location}`);
        }
        const obj = JSON.parse(contents);
        this.storagePathToRequestsObj.clear();
        if (obj.values) {
            // values
            const name = this.baseName(from.location, 'postman_environment');
            const values: any = {};
            for (const value of obj.values) {
                if (value.enabled) {
                    values[value.key] = value.value;
                }
            }
            this.writeStorage(`${this.root}/${name}.json`, JSON.stringify(values, null, this.indent));
        } else if (obj.item) {
            // requests
            const name = this.baseName(from.location, 'postman_collection');
            this.processItem(`${this.root}/${name}`, obj.item);
            for (const [path, requestsObj] of this.storagePathToRequestsObj) {
                this.writeStorage(path, yaml.dump(requestsObj, this.indent));
            }
        }
    }

    private baseName(location: Location, suffix: string): string {
        let name = location.base;
        const dotPc = name.lastIndexOf(`.${suffix}`);
        if (dotPc > 0) {
            name = name.substring(0, dotPc);
        }
        return name;
    }

    private writeStorage(path: string, content: string) {
        const storage = new Storage(path);
        if (storage.exists) {
            this.logger.info(`Overwriting: ${storage}`);
        } else {
            this.logger.info(`Creating: ${storage}`);
        }
        storage.write(content);
    }

    private processItem(path: string, item: any[]) {
        for (const it of item) {
            if (it.request) {
                // write the request
                const name = it.name as string;
                try {
                    const request = this.translateRequest(it.request);
                    const storagePath = `${path.replace(/ \/ /g, '/')}.ply.yaml`;
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
            url: this.replaceExpressions(postmanRequest.url.raw),
            method: this.replaceExpressions(postmanRequest.method)
        };
        if (postmanRequest.header && postmanRequest.header.length > 0) {
            request.headers = {};
            for (const head of postmanRequest.header) {
                request.headers[head.key] = this.replaceExpressions(head.value);
            }
        }
        if (postmanRequest.body) {
            if (typeof postmanRequest.body === 'string') {
                request.body = this.replaceExpressions(postmanRequest.body);
            } else {
                const mode = postmanRequest.body.mode;
                if (mode === 'graphql') {
                    request.body = this.replaceExpressions(postmanRequest.body.graphql.query);
                } else if (mode === 'raw') {
                    request.body = this.replaceExpressions(postmanRequest.body.raw);
                } else {
                    throw new Error(`Unsupported request body mode: ${postmanRequest.body.mode}`);
                }
            }
        }
        return request;
    }

    private isJson(postmanRequest: any, bodyContent: string): boolean {
        if (postmanRequest.body?.options?.raw?.language === 'json') {
            return true;
        }
        if (bodyContent.startsWith('{') && bodyContent.endsWith('}')) {
            try {
                JSON.parse(bodyContent);
                return true;
            } catch (err) {
                this.logger.debug(`Request not parseable as JSON: ${err.message}`);
            }
        }
        return false;
    }

    private replaceExpressions(input: string): string {
        return input.replace(/\{\{(.*?)}}/g, function(_a, b) {
            return '${' + b + '}';
        });
    }
}