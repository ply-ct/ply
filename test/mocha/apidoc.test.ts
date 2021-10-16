import * as assert from 'assert';
import * as fs from 'fs';
import * as mkdirp from 'mkdirp';
import { Retrieval } from '../../src/retrieval';
import { Logger } from '../../src/logger';
import { Plyex } from '../../src/plyex/plyex';

describe('API Docs', () => {

    it('should find nestjs endpoints', () => {
        const file = 'test/mocha/plyex/nestjs.ts';
        const plyex = new Plyex('nestjs', new Logger(), { tsConfig: 'test/tsconfig.json', sourcePatterns: [file] });
        const endpointMethods = plyex.getPluginEndpointMethods();

        const getBase = endpointMethods.find(em => em.method === 'get' && em.path === '/greeting');
        assert.ok(getBase);
        assert.strictEqual(getBase.file, file);
        assert.strictEqual(getBase.class, 'PlyexClass');
        assert.strictEqual(getBase.name, 'getGreeting');
        assert.strictEqual(getBase.path, '/greeting');

        const getName = endpointMethods.find(em => em.method === 'get' && em.path === '/greeting/{name}');
        assert.ok(getName);
        assert.strictEqual(getName.file, file);
        assert.strictEqual(getName.class, 'PlyexClass');
        assert.strictEqual(getName.name, 'getGreeting');
        assert.strictEqual(getName.path, '/greeting/{name}');

        const post = endpointMethods.find(em => em.method === 'post');
        assert.ok(post);
        assert.strictEqual(post.file, file);
        assert.strictEqual(post.class, 'PlyexClass');
        assert.strictEqual(post.name, 'postGreeting');
        assert.strictEqual(post.path, '/greeting');
    });

    it('should augment nestjs openapi doc', async () => {
        const file = 'test/mocha/plyex/nestjs.ts';
        const plyex = new Plyex('nestjs', new Logger(), { tsConfig: 'test/tsconfig.json', sourcePatterns: [file] });
        const openApiYaml = fs.readFileSync('test/mocha/plyex/base.yaml', { encoding: 'utf8' });
        const tempDir = 'test/mocha/plyex/temp';
        mkdirp.sync(tempDir);
        fs.writeFileSync(`${tempDir}/openapi.yaml`, openApiYaml, { encoding: 'utf8' });
        await plyex.augment(new Retrieval(`${tempDir}/openapi.yaml`));
        const outputYaml = fs.readFileSync(`${tempDir}/openapi.yaml`, { encoding: 'utf8' });
        const expectedYaml = fs.readFileSync('test/mocha/plyex/openapi.yaml', { encoding: 'utf8' });
        assert.strictEqual(outputYaml, expectedYaml);
    });
});