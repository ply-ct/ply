import * as ts from 'typescript';
import { Ply } from '../ply';
import { Request } from '../request';
import { FlowSuite } from '../flows';
import { Suite } from '../suite';
import { Ts } from '../ts';
import * as yaml from '../yaml';
import { EndpointMethod } from './plyex';

export interface MethodMeta {
    name: string;
    summary: string;
    description?: string;
}

/**
 * Raw info as parsed from plyex JSDoc tag.
 */
export interface PlyMeta {
    request?: string;
    responses?: { [key: string]: string[] };
}

export interface PlyEndpointMeta {
    operationId?: string;
    summaries: string[];
    description?: string;
    plyMeta?: PlyMeta;
    examples?: {
        request?: string;
        responses?: { [key: string]: string[] };
    };
}

export class PlyExampleRequest {
    readonly suitePath: string;
    readonly requestName: string;

    constructor(requestPath: string) {
        const hash = requestPath.lastIndexOf('#');
        if (hash === -1 || hash > requestPath.length - 1) {
            throw new Error(`Ply example path must include '#<requestName>': ${requestPath}`);
        }
        this.suitePath = requestPath.substring(0, hash);
        this.requestName = requestPath.substring(hash + 1);
    }

    async getSuite(): Promise<Suite<Request> | FlowSuite> {
        let suite: Suite<Request> | FlowSuite;
        if (this.suitePath.endsWith('.flow')) {
            suite = PlyExampleRequest.flowSuites.get(this.suitePath);
            if (!suite) {
                suite = await new Ply().loadFlow(this.suitePath);
                PlyExampleRequest.requestSuites.set(this.suitePath, suite);
            }
        } else {
            suite = PlyExampleRequest.requestSuites.get(this.suitePath);
            if (!suite) {
                suite = await new Ply().loadRequestSuite(this.suitePath);
                PlyExampleRequest.requestSuites.set(this.suitePath, suite);
            }
        }
        return suite;
    }

    async getExpected(): Promise<any> {
        let expectedObj = PlyExampleRequest.expectedObjs.get(this.suitePath);
        if (!expectedObj) {
            const suite = await this.getSuite();
            const expected = suite.runtime.results.expected;
            const contents = expected.storage?.read();
            if (!contents) throw new Error(`Invalid results location: ${expected.storage}`);
            expectedObj = yaml.load('' + expected.storage, contents);
            if (this.suitePath.endsWith('.flow')) {
                expectedObj = Object.keys(expectedObj).reduce((obj, key) => {
                    const step = expectedObj[key];
                    if (step.id && step.request && step.response) {
                        obj[step.id] = {
                            id: step.id,
                            request: step.request,
                            response: step.response
                        };
                    }
                    return obj;
                }, {} as any);
            }
            PlyExampleRequest.expectedObjs.set(this.suitePath, expectedObj);
        }
        return expectedObj;
    }

    async getExampleRequest(): Promise<string | undefined> {
        const expected = await this.getExpected();
        return expected[this.requestName]?.request?.body;
    }

    async getExampleResponse(): Promise<string | undefined> {
        const expected = await this.getExpected();
        return expected[this.requestName]?.response?.body;
    }

    private static requestSuites = new Map<string, any>();
    private static flowSuites = new Map<string, any>();
    private static expectedObjs = new Map<string, any>();
}

export class JsDocReader {
    constructor(private ts: Ts, readonly sourceFile: ts.SourceFile) {}

    async getPlyEndpointMeta(
        endpointMethod: EndpointMethod,
        tag = 'ply',
        untaggedMethods = false
    ): Promise<PlyEndpointMeta | undefined> {
        const classDecl = this.ts.getClassDeclaration(
            this.sourceFile.fileName,
            endpointMethod.class
        );
        if (classDecl) {
            const methodDecl = Ts.methodDeclarations(classDecl).find(
                (md) => md.name.getText() === endpointMethod.name
            );
            if (methodDecl) {
                const methodMeta = this.findMethodMeta(methodDecl);
                if (methodMeta) {
                    const plyMeta = this.readPlyMeta(endpointMethod.class, methodDecl, tag);
                    if (plyMeta || untaggedMethods) {
                        const plyEndpointMeta: PlyEndpointMeta = {
                            summaries: [methodMeta.summary]
                        };

                        // @operationId tag
                        const operationId = this.readStringMeta(methodDecl, 'operationId');
                        if (operationId) plyEndpointMeta.operationId = operationId;

                        const pipe = methodMeta.summary.indexOf('|');
                        if (pipe > 0 && pipe < methodMeta.summary.length - 1) {
                            plyEndpointMeta.summaries = [
                                methodMeta.summary.substring(0, pipe).trim(),
                                methodMeta.summary.substring(pipe + 1).trim()
                            ];
                        }
                        if (methodMeta.description) {
                            plyEndpointMeta.description = methodMeta.description;
                        }

                        // @ply tag
                        let exampleRequest: string | undefined;
                        if (plyMeta?.request) {
                            exampleRequest = await new PlyExampleRequest(
                                plyMeta.request
                            ).getExampleRequest();
                        }
                        let exampleResponses: { [key: string]: string[] } | undefined;
                        if (plyMeta?.responses) {
                            for (const key of Object.keys(plyMeta.responses)) {
                                const responses = plyMeta.responses[key];
                                for (const response of responses) {
                                    const exampleResponse = await new PlyExampleRequest(
                                        response
                                    ).getExampleResponse();
                                    if (exampleResponse) {
                                        if (!exampleResponses) {
                                            exampleResponses = {};
                                        }
                                        if (!exampleResponses['' + key]) {
                                            exampleResponses['' + key] = [];
                                        }
                                        exampleResponses['' + key].push(exampleResponse);
                                    }
                                }
                            }
                        }
                        if (exampleRequest || exampleResponses) {
                            plyEndpointMeta.examples = {
                                ...(exampleRequest && { request: exampleRequest }),
                                ...(exampleResponses && { responses: exampleResponses })
                            };
                        }

                        if (
                            (endpointMethod.method === 'post' ||
                                endpointMethod.method === 'put' ||
                                endpointMethod.method === 'patch') &&
                            !plyEndpointMeta.examples?.request
                        ) {
                            console.error(
                                `** Warning: No @${tag} sample request for: ${endpointMethod.class}.${endpointMethod.name}()`
                            );
                        }
                        if (Object.keys(plyEndpointMeta.examples?.responses || {}).length === 0) {
                            console.error(
                                `** Warning: No @${tag} sample responses for: ${endpointMethod.class}.${endpointMethod.name}()`
                            );
                        }
                        return plyEndpointMeta;
                    }
                }
            }
        }
    }

    /**
     * Summary is first line or sentence of a JSDoc comment, if any.
     * Description is the remainder.
     */
    findMethodMeta(methodDeclaration: ts.MethodDeclaration): MethodMeta | undefined {
        const symbol = Ts.symbolAtNode(methodDeclaration);
        const docComment = symbol?.getDocumentationComment(this.ts.checker);
        if (docComment?.length && docComment[0].kind === 'text' && docComment[0].text) {
            const lines = docComment[0].text.split(/\r?\n/);
            const dot = lines[0].indexOf('.');
            const meta: MethodMeta = {
                name: methodDeclaration.name.getText(),
                summary: (dot > 0 ? lines[0].substring(0, dot) : lines[0]).trim()
            };
            let descrip =
                dot > 0 && dot < lines[0].length + 1 ? lines[0].substring(dot + 1).trim() : '';
            for (let i = 1; i < lines.length; i++) {
                descrip += `\n${lines[i].trim()}`;
            }
            if (descrip.length) meta.description = descrip.trim();
            return meta;
        }
    }

    readStringMeta(methodDeclaration: ts.MethodDeclaration, tag: string): string | undefined {
        const symbol = Ts.symbolAtNode(methodDeclaration);
        const jsDocTag = symbol?.getJsDocTags()?.find((t) => t.name === tag);
        if (jsDocTag?.text) {
            let tagText: any = jsDocTag.text;
            if (Array.isArray(tagText)) {
                // depends on typescript version
                tagText = tagText[0].text;
            }
            return tagText;
        }
    }

    readPlyMeta(
        className: string,
        methodDeclaration: ts.MethodDeclaration,
        tag: string
    ): PlyMeta | undefined {
        const symbol = Ts.symbolAtNode(methodDeclaration);
        const plyJsDocTag = symbol?.getJsDocTags()?.find((t) => t.name === tag);
        if (plyJsDocTag?.text) {
            let tagText: any = plyJsDocTag.text;
            if (Array.isArray(tagText)) {
                // depends on typescript version
                tagText = tagText[0].text;
            }
            try {
                const plyMeta: PlyMeta = yaml.load(
                    `${methodDeclaration.name.getText()}: @${tag}`,
                    `${tagText}\n`
                );
                if (plyMeta.responses) {
                    for (const code of Object.keys(plyMeta.responses)) {
                        if (typeof plyMeta.responses[code] === 'string') {
                            plyMeta.responses[code] = ['' + plyMeta.responses[code]];
                        }
                    }
                }
                return plyMeta;
            } catch (err: unknown) {
                console.debug(`${err}`, err);
                throw new Error(
                    `Failed to parse @${tag} tag for ${className}.${symbol?.name}():\n${err}`
                );
            }
        }
    }
}
