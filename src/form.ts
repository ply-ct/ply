import * as fs from 'fs';
import * as FormData from 'form-data';
import { Request } from './request';
import * as util from './util';

interface Part {
    name: string;
    data?: Buffer;
    filename?: string;
}

export class MultipartForm {

    private options = { fileNameToBase: true };
    private contentTypeHeader: [string, string];
    private parts: Part[];

    constructor(readonly request: Request) {
        const contentTypeHeader = util.header(request.headers, 'Content-Type');
        if (!contentTypeHeader) throw new Error('Missing header: Content-Type');
        this.contentTypeHeader = contentTypeHeader;
        const contentType = this.contentTypeHeader[1];
        if (!contentType.toLowerCase().startsWith('multipart/form-data')) {
            throw new Error(`Invalid Content-Type: ${contentType}`);
        }

        const boundary = this.getBoundary(contentType);

        if (!request.body) throw new Error('Body is required for multipart/form-data');
        this.parts = this.getParts(request.body, boundary);
     }

    getRequest(): Request {
        const formData = new FormData();
        for (const part of this.parts) {
            if (part.filename) {
                if (!fs.existsSync(part.filename)) {
                    throw new Error(`File not found: ${part.filename}`);
                }
                formData.append(part.name, fs.createReadStream(part.filename));
            } else if (part.data) {
                formData.append(part.name, part.data);
            }
        }

        const contentTypeKey = this.contentTypeHeader[0];
        const { [contentTypeKey]: _ctKey, ...headers } = this.request.headers;
        return {
            name: this.request.name,
            type: this.request.type,
            url: this.request.url,
            method: this.request.method,
            headers,
            body: formData as any,
            submitted: this.request.submitted,
            submit: this.request.submit
        };
    }

    getBoundary(contentType: string): string {
        const segs = contentType.split(';').map(s => s.trim());
        if (segs.length < 2 || !segs[1].startsWith('boundary=') || segs[1].length < 11) {
            throw new Error('boundary is required');
        }
        return segs[1].substring(10, segs[1].length - 1);
    }

    getParts(body: string, boundary: string): Part[] {
        const lines = util.lines(body).map(l => l.trim());
        return lines.reduce((parts: Part[], line) => {
            if (line === boundary) {
                parts.push({ name: '' });
            } else {
                const part = parts[parts.length - 1];
                if (!part) throw new Error('Missing boundary start');
                if (line.toLowerCase().startsWith('content-disposition')) {
                    const segs = line.split(';').map(s => s.trim());
                    if (segs.length < 2 || !segs[1].startsWith('name=') || segs[1].length < 7) {
                        throw new Error('name is required');
                    }
                    part.name = segs[1].substring(6, segs[1].length - 1);
                    const filenameSeg = segs.find(s => s.startsWith('filename='));
                    if (filenameSeg && filenameSeg.length >= 11) {
                        part.filename = filenameSeg.substring(10, filenameSeg.length - 1);
                    }
                } else if (line !== `${boundary}--`) {
                    if (!part.data) part.data = Buffer.alloc(0);
                    part.data = Buffer.concat([part.data, Buffer.from(line)]);
                }
            }
            return parts;
        }, []);
    }
}