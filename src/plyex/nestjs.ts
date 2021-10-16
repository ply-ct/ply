import { Ts } from '../ts';
import { Method } from './openapi';
import { EndpointMethod, PlyexPlugin } from './plyex';

export declare function Controller(prefix: string | string[]): ClassDecorator;
export declare const Get: (path?: string | string[]) => MethodDecorator;
export declare const Post: (path?: string | string[]) => MethodDecorator;
export declare const Put: (path?: string | string[]) => MethodDecorator;
export declare const Patch: (path?: string | string[]) => MethodDecorator;
export declare const Delete: (path?: string | string[]) => MethodDecorator;

export class NestJsPlugin implements PlyexPlugin {

    constructor(private ts: Ts) {
    }

    getEndpointMethods(): EndpointMethod[] {
        const endpointMethods: EndpointMethod[] = [];
        for (const classDec of this.ts.scanClassDecorators(['Controller'])) {
            for (const methodDec of this.ts.findMethodDecorators(classDec, ['Get', 'Post', 'Put', 'Patch', 'Delete'])) {
                let path = '' + classDec.arg;
                if (!path.startsWith('/')) path = `/${path}`;
                let lastSegmentOptional = false;
                if (methodDec.arg) {
                    let subpath = methodDec.arg;
                    if (subpath.endsWith('?')) {
                        subpath = subpath.substring(0, subpath.length - 1);
                        endpointMethods.push({
                            file: methodDec.file,
                            class: methodDec.class,
                            method: methodDec.decorator.toLowerCase() as Method,
                            name: methodDec.method!,
                            path
                        });
                        lastSegmentOptional = true;
                    }
                    if (!subpath.startsWith('/')) subpath = `/${subpath}`;
                    if (subpath.startsWith('/:')) {
                        subpath = `/{${subpath.substring(2)}}`;
                    }
                    path += subpath;
                }
                endpointMethods.push({
                    file: methodDec.file,
                    class: methodDec.class,
                    method: methodDec.decorator.toLowerCase() as Method,
                    name: methodDec.method!,
                    path,
                    ...(lastSegmentOptional && { lastSegmentOptional })
                });
            }
        }

        return endpointMethods;
    }
}