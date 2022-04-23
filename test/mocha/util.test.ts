import { promises as fs } from 'fs';
import * as assert from 'assert';
import * as util from '../../src/util';

describe('util', async () => {
    const exists = async (path: string) => !!(await fs.stat(path).catch((_e) => false));

    it('should recursively rmdirs', async () => {
        await fs.mkdir('test/temp/foo/bar', { recursive: true });
        await fs.writeFile('test/temp/foo/bar/baz.txt', 'Hello, Baz');
        assert.ok(await exists('test/temp/foo/bar/baz.txt'));
        await util.rmdirs('test/temp/foo');
        assert.ok(!(await exists('test/temp/foo')));
        // no error on not exists
        await util.rmdirs('test/temp/foo');
    });
});
