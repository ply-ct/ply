import * as assert from 'assert';
import { resolve } from 'path';
import { Location } from '../../src/location';

describe('Location', () => {

    it('should resolve relative', () => {
        const path = resolve('test/ply/requests/movie-queries.ply.yaml');
        const location = new Location(path);
        const relPath = location.relativeTo('test/ply');
        assert.strictEqual(relPath, 'requests/movie-queries.ply.yaml');
    });
});