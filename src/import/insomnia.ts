import { Importer, ImportOptions, Request } from './model';
import { Retrieval } from '../retrieval';
import { Storage } from '../storage';
import { Log } from '../logger';
import * as yaml from '../yaml';

interface RequestGroup {
    id: string
    name: string;
    path: string;
    requests?: {[name: string]: Request};
    requestGroups?: RequestGroup[];
}

interface Workspace extends RequestGroup { }

/**
 * TODO: values
 */
export class Insomnia implements Importer {

    constructor(
        readonly root: string,
        readonly logger: Log
    ) { }

    async import(from: Retrieval, options?: ImportOptions) {
        const opts = { indent: 2, individualRequests: false, ...(options || {}) };

        const contents = await from.read();
        if (!contents) {
            throw new Error(`Import source not found: ${from.location}`);
        }
        let obj: any;
        if (contents.startsWith('{')) {
            obj = JSON.parse(contents);
        } else {
            obj = yaml.load(from.location.toString(), contents);
        }

        const workspaces = this.loadWorkspaces(obj);
        for (const workspace of workspaces) {
            this.writeRequests(workspace, opts);
        }
    }

    private loadWorkspaces(obj: any): Workspace[] {
        const resources = obj.resources;
        if (!Array.isArray(resources)) throw new Error(`Bad format: 'resources' array not found`);

        const wss = resources.filter(res => res._type === 'workspace');
        if (wss.length === 0) throw new Error('Workspace not found');

        const workspaces: Workspace[] = [];
        for (const ws of wss) {
            const workspace: Workspace = {
                id: ws._id,
                name: ws.name,
                path: this.root + '/' + this.writeableName(ws.name)
            };
            this.loadRequests(workspace, resources);
            workspaces.push(workspace);
        }
        return workspaces;
    }

    private loadRequests(container: Workspace | RequestGroup, resources: any[]) {
        const children = resources.filter(res => res.parentId === container.id);

        const reqGroups = children.filter(c => c._type === 'request_group');
        for (const reqGroup of reqGroups) {
            if (!container.requestGroups) container.requestGroups = [];
            const requestGroup: RequestGroup = {
                id: reqGroup._id,
                name: reqGroup.name,
                path: container.path + '/' + this.writeableName(reqGroup.name)
            };
            container.requestGroups.push(requestGroup);
            this.loadRequests(requestGroup, resources);
        }

        const reqs = children.filter(c => c._type === 'request');
        for (const req of reqs) {
            if (!container.requests) container.requests = {};
            if (req.url) {
                const request: Request = {
                    url: this.replaceExpressions(req.url),
                    method: this.replaceExpressions(req.method)
                };
                if (Array.isArray(req.headers) && req.headers.length > 0) {
                    request.headers = {};
                    for (const hdr of req.headers) {
                        if (hdr.value) request.headers[hdr.name] = this.replaceExpressions(hdr.value);
                    }
                }
                if (req.body?.text) {
                    if (req.body.mimeType === 'application/graphql') {
                        const graphql = JSON.parse(req.body.text);
                        if (graphql.query) {
                            request.body = this.replaceExpressions(graphql.query);
                        } else {
                            request.body = this.replaceExpressions(req.body.text);
                        }

                    } else {
                        request.body = this.replaceExpressions(req.body.text);
                    }
                }
                const existing = container.requests[req.name];
                if (existing && existing.method !== request.method) {
                    // qualify both with method
                    container.requests[`${existing.method} ${req.name}`] = existing;
                    delete container.requests[req.name];
                    req.name = `${req.method} ${req.name}`;
                }
                container.requests[req.name] = request;
            } else {
                this.logger.info(`Skipping request ${req.name} with empty url`);
            }
        }
    }

    private writeRequests(container: Workspace | RequestGroup, options: ImportOptions) {
        if (container.requests) {
            if (options.individualRequests) {
                for (const requestName of Object.keys(container.requests)) {
                    const reqObj = { [requestName]: container.requests[requestName] };
                    const reqYaml = yaml.dump(reqObj, options.indent || 2);
                    this.writeStorage(container.path + '/' + this.writeableName(requestName) + '.ply', reqYaml);
                }
            } else {
                const reqsYaml = yaml.dump(container.requests, options.indent || 2);
                this.writeStorage(`${container.path}.ply.yaml`, reqsYaml);
            }
        }
        if (container.requestGroups) {
            for (const requestGroup of container.requestGroups) {
                this.writeRequests(requestGroup, options);
            }
        }
    }

    private writeableName(name: string): string {
        // windows doesn't allow : in filenames
        return name.replace(/ \/ /g, '/').replace(/:/g, '-');
    }

    private replaceExpressions(input: string): string {
        return input.replace(/\{\{(.*?)}}/g, function(_a, b) {
            return '${' + b + '}';
        });
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

}