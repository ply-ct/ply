import * as fs from 'fs';
import * as assert from 'assert';
import * as json from '../../src/json';

describe('json', () => {
    it('merges json deltas', async () => {
        const configFile = 'plyconfig.json';
        const configJson = await fs.promises.readFile(configFile, {
            encoding: 'utf-8'
        });

        const delta = {
            valuesFiles: {
                'test/ply/values/global.json': true,
                'test/ply/values/localhost.json': false
            }
        };

        const result = json.merge(configFile, configJson, delta, 2);

        const afterFile = 'test/mocha/json/after.json';
        const afterJson = await fs.promises.readFile(afterFile, {
            encoding: 'utf-8'
        });

        assert.strictEqual(result, afterJson);
    });
});
