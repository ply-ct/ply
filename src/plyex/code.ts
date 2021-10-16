import * as fs from 'fs';
import * as path from 'path';
import * as handlebars from 'handlebars';
import { Method } from './openapi';

export interface PathChunk {
    path: string;
    param: boolean;
}

export interface TemplateContext {
    chunks: PathChunk[];
    type: string;
    name: string;
    item?: { name: string; value: string };
    array: boolean;
}

export class CodeSamples {
    private templates: { [lang: string]: (context: TemplateContext) => string };

    constructor(readonly method: Method) {
        this.templates = this.readTemplates(method);
    }

    readTemplates(method: Method): { [lang: string]: (context: TemplateContext) => string } {
        const templates: { [lang: string]: (context: TemplateContext) => string } = {};
        const templateDir = path.resolve(path.join(__dirname, '..', '..', 'templates', method));
        if (fs.existsSync(templateDir)) {
            for (const file of fs.readdirSync(templateDir)) {
                if (file.endsWith('.handlebars')) {
                    const txt = fs.readFileSync(path.join(templateDir, file), 'utf-8');
                    templates[path.basename(file, '.handlebars')] = handlebars.compile(txt);
                }
            }
        }
        return templates;
    }

    getSamples(context: TemplateContext): { [key: string]: string } {
        const samples: { [key: string]: string } = {};
        for (const lang of Object.keys(this.templates)) {
            samples[lang] = this.templates[lang](context);
        }
        return samples;
    }
}

handlebars.registerHelper('capitalize', (value) => {
    const str = '' + value;
    if (str.length) return `${str.charAt(0).toUpperCase()}${str.substring(1)}`;
});

handlebars.registerHelper('expression', (value) => {
    return '{' + value + '}';
});
