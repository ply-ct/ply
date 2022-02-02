import { getReasonPhrase } from 'http-status-codes';
import { OpenApi, Path, Method, Operation, JsonMedia } from './openapi';
import { NestJsPlugin } from './nestjs';
import { JsDocReader, PlyEndpointMeta } from './apidocs';
import { Log } from '../logger';
import { Ts } from '../ts';
import { CodeSamples, PathChunk, TemplateContext } from './code';

export interface EndpointMethod {
    file: string;
    class: string;
    name: string;
    path: string;
    method: 'get' | 'post' | 'put' | 'patch' | 'delete';
    lastSegmentOptional?: boolean;
}

export interface PlyexOptions {
    tsConfig?: string;
    sourcePatterns?: string[];
    addMissingOperations?: boolean;
    /**
     * Overwrite existing summaries, operationIds, descriptions, examples and code samples.
     */
    overwrite?: boolean;
    /**
     * Add operations summaries/descripts for endpoint methods not tagged with @ply.
     */
    includeUntagged?: boolean;
}

export const defaultOptions: PlyexOptions = {
    tsConfig: 'tsconfig.json',
    sourcePatterns: ['src/**/*.ts'],
    addMissingOperations: true,
    overwrite: false,
    includeUntagged: true
};

export class Plyex {

    readonly options: PlyexOptions;
    private ts: Ts;
    private jsDocReaders = new Map<string,JsDocReader>();

    constructor(
        readonly plugin: string,
        readonly logger: Log,
        options?: PlyexOptions
    ) {
        this.options = { ...defaultOptions, ...(options || {}) };
        this.ts = new Ts(this.options.tsConfig, this.options.sourcePatterns);
    }

    getPluginEndpointMethods(): EndpointMethod[] {
        if (this.plugin === 'nestjs') {
            return new NestJsPlugin(this.ts).getEndpointMethods();
        } else {
            throw new Error(`Unsupported plyex plugin: ${this.plugin}`);
        }
    }

    augment(openApi: OpenApi, endpointMethods?: EndpointMethod[]): OpenApi {

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

        const augmented = this.doAugment(openApi, endpointMethods);

        return augmented;
    }

    doAugment(openApi: OpenApi, endpointMethods: EndpointMethod[]): OpenApi {
        const deepCopy = JSON.parse(JSON.stringify(openApi));
        const openApiPaths: { [path: string]: Path } = deepCopy.paths || {};
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

                    const plyEndpointMeta = jsDocReader.getPlyEndpointMeta(endpointMethod, 'ply', this.options.includeUntagged);
                    if (plyEndpointMeta) {
                        if (!operation.summary || this.options.overwrite) {
                            if (plyEndpointMeta.summaries.length > 1 && endpointMethod.lastSegmentOptional) {
                                operation.summary = plyEndpointMeta.summaries[1];
                            } else {
                                operation.summary = plyEndpointMeta.summaries[0];
                            }
                        }
                        if (plyEndpointMeta.operationId && (!operation.operationId || this.options.overwrite)) {
                            operation.operationId = plyEndpointMeta.operationId;
                        }
                        if (plyEndpointMeta.description && (!operation.description || this.options.overwrite)) {
                            operation.description = plyEndpointMeta.description;
                        }
                        this.examples(endpointMethod, operation, plyEndpointMeta);
                    }
                }
            }
        }
        return deepCopy;
    }

    operation(endpointMethod: EndpointMethod): Operation {
        this.logger.info(`Adding OpenAPI operation: ${endpointMethod.path}.${endpointMethod.method}`);
        return { summary: '' };
    }

    examples(endpointMethod: EndpointMethod, operation: Operation, plyEndpointMeta: PlyEndpointMeta) {
        if (plyEndpointMeta.examples?.request) {
            if (!operation.requestBody) operation.requestBody = { description: '', content: {}, required: true };
            const reqContent = operation.requestBody.content;
            let jsonPayload = reqContent['application/json'];
            if (!jsonPayload) {
                jsonPayload = reqContent['application/json'] = { schema: {} };
            }
            if (jsonPayload) {
                if (!operation.requestBody.description) {
                    const schemaType = this.schemaType(jsonPayload);
                    if (schemaType) operation.requestBody.description = this.typeName(schemaType);
                }
                if (!jsonPayload.example || this.options.overwrite) {
                    jsonPayload.example = this.example(endpointMethod, plyEndpointMeta.examples.request);
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
                                if (!operation.responses[code].description) {
                                    operation.responses[code].description = '' + code;
                                }
                            }
                            if (!jsonPayload.example || this.options.overwrite) {
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
        let ref = schema.$ref;
        if (schema.type === 'array' && schema.items?.$ref) {
            ref = schema.items.$ref;
        }
        if (ref) {
            let type = ref.substring(ref.lastIndexOf('/') + 1);
            if (schema.type === 'array') type = `[${type}]`;
            return type;
        }
        return '';
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
