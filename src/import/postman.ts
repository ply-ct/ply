import { Importer, ImportOptions, Request } from './model';
import { Retrieval } from '../retrieval';
import { Location } from '../location';
import { Storage } from '../storage';
import { Log } from '../log';
import * as yaml from '../yaml';
import * as util from '../util';

export class Postman implements Importer {
    private storagePathToRequestsObj = new Map<string, { [key: string]: Request }>();

    constructor(readonly logger: Log) {}

    async import(from: Retrieval, options: ImportOptions) {
        const opts: ImportOptions = { indent: 2, importToSuite: false, ...options };
        const contents = await from.read();
        if (!contents) {
            throw new Error(`Import source not found: ${from.location}`);
        }
        const obj = JSON.parse(contents);
        this.storagePathToRequestsObj.clear();
        if (obj.values) {
            // values
            const name = this.baseName(from.location);
            const values: any = {};
            for (const value of obj.values) {
                if (value.enabled) {
                    values[value.key] = value.value;
                }
            }
            this.writeStorage(
                `${opts.valuesLocation}/${name}.json`,
                JSON.stringify(values, null, opts.indent)
            );
        } else if (obj.item) {
            // requests
            const name = this.baseName(from.location);
            this.processItem(
                `${opts.testsLocation}/${name}`,
                obj.item,
                options.importToSuite || false
            );
            for (const [path, requestsObj] of this.storagePathToRequestsObj) {
                if (opts.importToSuite) {
                    this.writeStorage(path, yaml.dump(requestsObj, opts.indent || 2));
                } else {
                    for (const name of Object.keys(requestsObj)) {
                        const reqObj = { [name]: requestsObj[name] };
                        const reqPath = path + '/' + util.writeableFileName(name) + '.ply';
                        this.writeStorage(reqPath, yaml.dump(reqObj, opts.indent || 2));
                    }
                }
            }
        }
    }

    private baseName(location: Location): string {
        let name = location.base;
        const dot = name.indexOf('.');
        if (dot > 0) {
            name = name.substring(0, dot);
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

    private processItem(path: string, item: any[], importToSuite: boolean) {
        for (const it of item) {
            if (it.request) {
                // write the request
                const name = it.name as string;
                try {
                    const request = this.translateRequest(it.request);
                    let storagePath = path;
                    if (importToSuite) storagePath += '.ply.yaml';
                    const reqsObj = this.storagePathToRequestsObj.get(storagePath);
                    if (reqsObj) {
                        reqsObj[name] = request;
                    } else {
                        this.storagePathToRequestsObj.set(storagePath, { [name]: request });
                    }
                } catch (err: unknown) {
                    this.logger.error(`Request ${path}/${it.name} not imported due to: ${err}`);
                    this.logger.debug(`${err}`, err);
                }
            }
            if (it.item) {
                // windows doesn't support : in file names
                this.processItem(`${path}/${util.writeablePath(it.name)}`, it.item, importToSuite);
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

    private replaceExpressions(input: string): string {
        return input.replace(/\{\{(.*?)}}/g, function (_a, b) {
            return '${' + b + '}';
        });
    }
}
