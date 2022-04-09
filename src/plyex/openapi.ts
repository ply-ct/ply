/**
 * Basic elements are supported now.
 */
export interface OpenApi {
    openapi: string;
    info: Info;
    servers?: Server[];
    tags?: Tag[];
    paths?: { [path: string]: Path };
    components?: Components;
    security?: Auth[];
}

export type Auth = { bearerAuth: string[] };

export class BearerAuth {
    readonly type = 'http';
    readonly scheme = 'bearer';
    readonly bearerFormat = 'JWT';
}

export interface Components {
    schemas: { [key: string]: any };
    securitySchemes?: {
        bearerAuth?: BearerAuth;
    };
}

export type Method = 'get' | 'post' | 'put' | 'patch' | 'delete';
export type Path = { [name in Method]?: Operation };

export interface Operation {
    summary: string;
    operationId?: string;
    tags?: string[];
    description?: string;
    parameters?: Parameter[];
    requestBody?: RequestBody;
    responses?: { [code: string]: Response };
    'x-codeSamples'?: CodeSample[];
}

export type ParamType = 'path' | 'query' | 'header';

export interface Parameter {
    name: string;
    schema?: Schema;
    description?: string;
    in: ParamType;
    required: boolean;
    format?: string;
    example?: string | number | boolean;
}

export interface RequestBody {
    description: string;
    content: BodyContent;
    required: boolean;
}

export interface Response {
    description: string;
    content?: BodyContent;
}

export type MediaType =
    | 'application/json'
    | 'application/x-www-form-urlencoded'
    | 'multipart/form-data'
    | 'application/xml'
    | 'text/plain'
    | 'text/yaml'
    | 'application/yaml';

export type BodyContent = {
    [key in MediaType]?: Media;
};

export interface Media {
    schema: Schema;
    example?: object | string;
}

export interface Schema {
    $ref?: string;
    type?: string;
    items?: { $ref: string };
}

export interface Info {
    title: string;
    version: string;
    termsOfService?: string;
    contact?: Contact;
    license?: License;
}

export interface Contact {
    email: string;
}

export interface License {
    name: string;
    url: string;
}

export interface Server {
    url: string;
}

export interface Tag {
    name: string;
    description: string;
    externalDocs: { url: string; description?: string };
}

export interface CodeSample {
    lang: string;
    source: string;
}
