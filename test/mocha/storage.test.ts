import * as assert from 'assert';
import { Storage } from '../../src/storage';

describe('Storage', () => {

    it('should build path', () => {
        const storage = new Storage('temp/greeting.txt');
        assert.strictEqual(storage.toString(), 'temp/greeting.txt');
    });

    it('should write and read', async () => {
        const storage = new Storage('temp\\greeting.txt');
        assert.strictEqual('temp/greeting.txt', storage.location.toString());
        storage.write('Hello');
        assert.ok(storage.exists);
        const greeting = storage.read();
        assert.strictEqual(greeting, 'Hello');
        storage.remove();
        assert.ok(!storage.exists);
    });
});
