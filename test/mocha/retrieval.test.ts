import * as assert from 'assert';
import { Retrieval } from '../../src/retrieval';

describe('Retrieval', () => {
    it('should read file', async () => {
        const retrieval = new Retrieval('.gitignore');
        assert.ok(!retrieval.location.ext);
        const exists = await retrieval.exists;
        assert.ok(exists);
        const contents = await retrieval.read();
        assert.ok(contents && contents.indexOf('node_modules') >= 0);
    });

    it('should read url', async () => {
        const retrieval = new Retrieval(
            'https://raw.githubusercontent.com/ply-ct/ply/master/.gitignore'
        );
        const exists = await retrieval.exists;
        assert.ok(exists);
        const contents = await retrieval.read();
        assert.ok(contents && contents.indexOf('node_modules') >= 0);
    });
});
