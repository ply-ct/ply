import * as assert from 'assert';
import * as fs from 'fs';
import { Logger } from '../../src/logger';
import { Plyex } from '../../src/plyex/plyex';
import * as yaml from '../../src/yaml';
import { OpenApi } from '../../src/plyex/openapi';
import * as util from '../../src/util';

describe('API Docs', () => {
    it('should find nestjs endpoints', () => {
        const file = 'test/mocha/plyex/nestjs.ts';
        const plyex = new Plyex('nestjs', new Logger(), {
            tsConfig: 'test/tsconfig.json',
            sourcePatterns: [file]
        });
        const endpointMethods = plyex.getPluginEndpointMethods();

        const getBase = endpointMethods.find(
            (em) => em.method === 'get' && em.path === '/greeting'
        );
        assert.ok(getBase);
        assert.strictEqual(getBase.file, file);
        assert.strictEqual(getBase.class, 'PlyexClass');
        assert.strictEqual(getBase.name, 'getGreeting');
        assert.strictEqual(getBase.path, '/greeting');

        const getName = endpointMethods.find(
            (em) => em.method === 'get' && em.path === '/greeting/{name}'
        );
        assert.ok(getName);
        assert.strictEqual(getName.file, file);
        assert.strictEqual(getName.class, 'PlyexClass');
        assert.strictEqual(getName.name, 'getGreeting');
        assert.strictEqual(getName.path, '/greeting/{name}');

        const post = endpointMethods.find((em) => em.method === 'post');
        assert.ok(post);
        assert.strictEqual(post.file, file);
        assert.strictEqual(post.class, 'PlyexClass');
        assert.strictEqual(post.name, 'postGreeting');
        assert.strictEqual(post.path, '/greeting');
    });

    it('should augment nestjs openapi doc', async () => {
        const file = 'test/mocha/plyex/nestjs.ts';
        const base = 'test/mocha/plyex/base.yaml';
        const openApiYaml = fs.readFileSync(base, { encoding: 'utf8' });
        const openApi: OpenApi = yaml.load(base, openApiYaml);
        const plyex = new Plyex('nestjs', new Logger(), {
            tsConfig: 'test/tsconfig.json',
            sourcePatterns: [file]
        });
        const augmented = plyex.augment(openApi);
        Object.keys(augmented.paths!).forEach((p) => {
            const path = augmented.paths![p];
            Object.keys(path).forEach((m) => {
                const codeSamples = (path as any)[m]['x-codeSamples'];
                if (codeSamples) {
                    codeSamples.forEach((cs: any) => {
                        if (cs.source) {
                            cs.source = util.newlines(cs.source);
                        }
                    });
                }
            });
        });
        const newYaml = yaml.dump(augmented, 2).replace(/\\r/g, '');
        const expectedYaml = util.newlines(
            fs.readFileSync('test/mocha/plyex/openapi.yaml', { encoding: 'utf8' })
        );
        assert.strictEqual(newYaml, util.newlines(expectedYaml));
    });
});
