import { Retrieval } from '../retrieval';

export type ImportFormat = 'postman' | 'insomnia';

export interface ImportOptions {
    testsLocation: string;
    valuesLocation: string;
    indent?: number;
    individualRequests?: boolean;
}

export interface Importer {
    import(from: Retrieval, options?: ImportOptions): Promise<void>;
}

export interface Request {
    url: string;
    method: string;
    headers?: {[key: string]: string};
    body?: string;
}

