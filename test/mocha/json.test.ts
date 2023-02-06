import * as fs from 'fs';
import * as assert from 'assert';
import * as json from '../../src/json';

describe('json', () => {
    it('merges json deltas', async () => {
        const beforeFile = 'plyconfig.json';
        const beforeJson = await fs.promises.readFile(beforeFile, {
            encoding: 'utf-8'
        });

        const delta = {
            valuesFiles: {
                'test/ply/values/global.json': true,
                'test/ply/values/localhost.json': false
            }
        };

        const result = json.merge(beforeFile, beforeJson, delta, 2);

        const afterFile = 'test/mocha/json/after.json';
        const afterJson = await fs.promises.readFile(afterFile, {
            encoding: 'utf-8'
        });

        assert.strictEqual(result, afterJson);
    });
});
