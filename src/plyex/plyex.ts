import { getReasonPhrase } from 'http-status-codes';
import { Retrieval } from '../retrieval';
import { OpenApi, Path, Method, Operation, JsonMedia } from './openapi';
import { NestJsPlugin } from './nestjs';
import { JsDocReader, PlyEndpointMeta } from './apidocs';
import { Log } from '../logger';
import * as yaml from '../yaml';
import { Ts } from '../ts';
import { CodeSamples, PathChunk, TemplateContext } from './code';

export interface EndpointMethod {
    file: string;
    class: string;
    path: string;
    name: string;
    method: 'get' | 'post' | 'put' | 'patch' | 'delete';
    lastSegmentOptional?: boolean;
}

export interface PlyexOptions {
    indent?: number;
    write?: boolean;
    tsConfig?: string;
    sourcePatterns?: string[];
    addMissingOperations?: boolean;
}

export const defaultOptions: PlyexOptions = {
    indent: 2,
    write: true,
    tsConfig: 'tsconfig.json',
    sourcePatterns: ['src/**/*.ts'],
    addMissingOperations: true
};

export class Plyex {

    readonly options: PlyexOptions;
    private ts: Ts;
    private jsDocReaders = new Map<string,JsDocReader>();
    isYaml = false;

    constructor(
        readonly plugin: string,
        readonly logger: Log,
        options?: PlyexOptions
    ) {
        this.options = { ...defaultOptions, ...(options || {}) };
        this.ts = new Ts(this.options.tsConfig, this.options.sourcePatterns);
    }

    async getOpenApi(apiDoc: Retrieval): Promise<OpenApi> {
        const contents = await apiDoc.read();
        if (!contents) {
            throw new Error(`OpenAPI doc not found: ${apiDoc.location}`);
        }
        this.isYaml = !contents.startsWith('{');
        return this.isYaml ? yaml.load(`${apiDoc.location}`, contents) : JSON.parse(contents);
    }

    getPluginEndpointMethods(): EndpointMethod[] {
        if (this.plugin === 'nestjs') {
            return new NestJsPlugin(this.ts).getEndpointMethods();
        } else {
            throw new Error(`Unsupported plyex plugin: ${this.plugin}`);
        }
    }

    async augment(apiDoc: Retrieval, endpointMethods?: EndpointMethod[]): Promise<string | undefined> {
        const openApi = await this.getOpenApi(apiDoc);

        if (!endpointMethods) {
            endpointMethods = this.getPluginEndpointMethods();
        }
        if (this.options.addMissingOperations) {
            for (const endpointMethod of endpointMethods) {
                const openApiPath = (openApi.paths || {})[endpointMethod.path];
                if (!openApiPath) {
                    if (!openApi.paths) openApi.paths = {};
                    openApi.paths[endpointMethod.path] = { [endpointMethod.method]: this.operation(endpointMethod) };
                } else if (!openApiPath[endpointMethod.method]) {
                    openApiPath[endpointMethod.method] = this.operation(endpointMethod);
                }
            }
        }

        if (!openApi.paths) {
            this.logger.error('No paths found to augment', apiDoc);
            return await apiDoc.read();
        }

        await this.doAugment(openApi.paths, endpointMethods);

        let updated: string;
        if (this.isYaml) updated = yaml.dump(openApi, typeof this.options.indent === 'undefined' ? 2 : this.options.indent);
        else updated = JSON.stringify(openApi, null, this.options.indent);

        if (this.options.write) apiDoc.write(updated);
        return updated;
    }

    async doAugment(openApiPaths: { [path: string]: Path }, endpointMethods: EndpointMethod[]) {
        for (const path of Object.keys(openApiPaths)) {
            const openApiPath = openApiPaths[path];
            for (const method of Object.keys(openApiPath)) {
                const openApiMethod = method as Method;
                const operation = openApiPath[openApiMethod]!;
                const endpointMethod = endpointMethods.find(epm => {
                    return epm.path === path && epm.method === openApiMethod;
                });

                if (endpointMethod) {
                    let jsDocReader = this.jsDocReaders.get(endpointMethod.file);
                    if (!jsDocReader) {
                        const sourceFile = this.ts.program.getSourceFile(endpointMethod.file);
                        if (!sourceFile) {
                            throw new Error(`Source file (${endpointMethod.file}) not found for ${this.epm(endpointMethod)}`);
                        }
                        jsDocReader = new JsDocReader(this.ts, sourceFile);
                        this.jsDocReaders.set(endpointMethod.file, jsDocReader);
                    }
                    const plyEndpointMeta = jsDocReader.getPlyEndpointMeta(endpointMethod);
                    if (plyEndpointMeta) {
                        if (!operation.summary) operation.summary = plyEndpointMeta.summaries[0];
                        if (plyEndpointMeta.description && !operation.description) {
                            operation.description = plyEndpointMeta.description;
                        }
                        this.examples(operation, endpointMethod, plyEndpointMeta);
                    }
                }
            }
        }
    }

    operation(endpointMethod: EndpointMethod): Operation {
        this.logger.info(`Adding OpenAPI operation: ${endpointMethod.path}.${endpointMethod.method}`);
        return { summary: '' };
    }

    examples(operation: Operation, endpointMethod: EndpointMethod, plyEndpointMeta: PlyEndpointMeta) {
        if (plyEndpointMeta.examples?.request) {
            if (!operation.requestBody) operation.requestBody = { description: '', content: {}, required: true };
            const reqContent = operation.requestBody.content;
            let jsonPayload = reqContent['application/json'];
            if (!jsonPayload?.example) {
                if (!jsonPayload) {
                    jsonPayload = reqContent['application/json'] = { schema: {} };
                }
                if (jsonPayload) {
                    if (!operation.requestBody.description) {
                        const schemaType = this.schemaType(jsonPayload);
                        if (schemaType) operation.requestBody.description = this.typeName(schemaType);
                    }
                    const example = this.example(endpointMethod, plyEndpointMeta.examples.request);
                    jsonPayload.example = example;
                }
            }
        }
        if (plyEndpointMeta.examples?.responses) {
            if (!operation.responses) operation.responses = {};
            for (const code of Object.keys(plyEndpointMeta.examples.responses)) {
                const respExamples = plyEndpointMeta.examples.responses[code];
                if (respExamples.length > 0) {
                    const example = this.example(
                        endpointMethod,
                        endpointMethod.lastSegmentOptional && respExamples.length > 1 ? respExamples[1] : respExamples[0],
                        true);
                    if (!operation.responses[code]) operation.responses[code] = { description: '' };
                    let respContent = operation.responses[code].content;
                    if (!respContent && typeof example === 'object') {
                        respContent = operation.responses[code].content = { 'application/json': { schema: {} } };
                    }
                    if (respContent) {
                        let jsonPayload = respContent['application/json'];
                        if (!jsonPayload) {
                            jsonPayload = respContent['application/json'] = { schema: {} };
                        }
                        if (jsonPayload) {
                            if (!operation.responses[code].description) {
                                const intCode = parseInt(code);
                                if (!isNaN(intCode)) {
                                    operation.responses[code].description = getReasonPhrase(intCode);
                                }
                            }
                            if (!jsonPayload.example) {
                                jsonPayload.example = example;
                            }
                            if (jsonPayload.example) {
                                if (code === '200' || code === '201') {
                                    const schemaType = this.schemaType(jsonPayload) || 'Unknown';
                                    this.codeSamples(operation, endpointMethod, schemaType, jsonPayload.example);
                                }
                            }
                        }
                    }
                }
            }
        }
    }

    schemaType(jsonPayload: JsonMedia): string {
        const schema = jsonPayload.schema;
        let schemaType = '';
        const ref = schema?.$ref;
        if (ref) {
            schemaType = ref.substring(ref.lastIndexOf('/') + 1);
            if (schema.type === 'array') schemaType = `[${schemaType}]`;
        }
        return schemaType;
    }

    codeSamples(operation: Operation, endpointMethod: EndpointMethod, schemaType: string, example: any) {
        if (operation['x-codeSamples']) {
            return; // already added
        }

        const pathSegments = endpointMethod.path.substring(1).split('/');
        const pathChunks = pathSegments.reduce(
            (chunks: PathChunk[], seg: string) => {
                const chunk = chunks[chunks.length - 1];
                if (seg.startsWith('{') && seg.endsWith('}')) {
                    if (chunk.param) chunks.push({ path: '/', param: false });
                    else chunk.path += '/';
                    chunks.push({ path: seg.substring(1, seg.length - 1), param: true });
                } else if (chunk.param) {
                    chunks.push({ path: `/${seg}`, param: false });
                } else {
                    chunk.path += `/${seg}`;
                }
                return chunks;
            },
            [{ path: '', param: false }]
        );

        const isArray = schemaType.startsWith('[') && schemaType.endsWith(']');
        const type = isArray ? schemaType.substring(1, schemaType.length - 1) : schemaType;

        const templateContext: TemplateContext = {
            chunks: pathChunks,
            type,
            array: isArray,
            name: this.typeName(schemaType)
        };

        const last = pathSegments[pathSegments.length - 1];
        if (last.startsWith('{') && last.endsWith('}') && example) {
            const name = last.substring(1, last.length - 1);
            if (example[name]) {
                templateContext.item = { name, value: example[name] };
            }
        }
        const samples = new CodeSamples(endpointMethod.method).getSamples(templateContext);
        for (const lang of Object.keys(samples)) {
            if (!operation['x-codeSamples']) operation['x-codeSamples'] = [];
            operation['x-codeSamples'].push({ lang, source: samples[lang] });
        }
    }

    typeName(schemaType: string): string {
        if (!schemaType) return '';
        const isArray = schemaType.startsWith('[') && schemaType.endsWith(']');
        const type = isArray ? schemaType.substring(1, schemaType.length - 1) : schemaType;
        return isArray ? this.pluralize(this.uncapitalize(type)) : this.uncapitalize(type);
    }

    /**
     * Crude pluralization -- override with jsdoc
     */
     private pluralize(sing: string): string {
        if (
            sing.endsWith('s') ||
            sing.endsWith('sh') ||
            sing.endsWith('ch') ||
            sing.endsWith('x') ||
            sing.endsWith('z')
        ) {
            return sing + 'es';
        } else if (sing.endsWith('y')) {
            return sing.substring(0, sing.length - 1) + 'ies';
        } else {
            return sing + 's';
        }
    }

    private capitalize(lower: string): string {
        return `${lower.charAt(0).toUpperCase()}${lower.substring(1)}`;
    }

    private uncapitalize(cap: string): string {
        return `${cap.charAt(0).toLowerCase()}${cap.substring(1)}`;
    }

    private epm(endpointMethod: EndpointMethod): string {
        return `${endpointMethod.path}.${endpointMethod.name} ${endpointMethod.method}`;
    }

    private example(endpointMethod: EndpointMethod, example: string, isResponse = false): object | string {
        if (example.startsWith('{') || example.startsWith('[')) {
            try {
                return JSON.parse(this.cleanupJson(example));
            } catch (err: unknown) {
                this.logger.error(`Error parsing JSON example ${isResponse ? 'response' : 'request'}: ${this.epm(endpointMethod)}`, err);
            }
        }
        return example;
    }

    private cleanupJson(json: string): string {
        const lines: string[] = [];
        for (const line of json.split(/\r?\n/)) {
            lines.push(line.replace(/(?<!")\$\{.+?}/g, (_num) => '123'));
        }
        return lines.join('\n');
    }

}

export interface PlyexPlugin {
    getEndpointMethods(): EndpointMethod[];
}
