import * as assert from 'assert';
import { Retrieval } from '../../src/retrieval';
import { Import } from '../../src/import';
import { Logger } from '../../src';

describe('Import', () => {

    it('should import postman', async () => {
        const retrieval = new Retrieval('test/mocha/postman/movies.postman_collection.json');
        assert.ok(retrieval.location.ext);
        assert.ok(await retrieval.exists);
        // const importer = new Import('postman', 'test/mocha/temp', new Logger(), 2);
        // importer.doImport(retrieval);
    });

});
