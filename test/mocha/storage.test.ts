import * as assert from 'assert';
import { Storage } from '../../src/storage';

describe('Storage', () => {

    it('should build path', () => {
        let storage = new Storage('temp/greeting.txt');
        assert.equal(storage.toString(), 'temp/greeting.txt');
    });

    it('should write and read', async () => {
        let storage = new Storage('temp\\greeting.txt');
        assert.equal('temp/greeting.txt', storage.location.toString());
        storage.write('Hello');
        assert.ok(storage.exists);
        let greeting = storage.read();
        assert.equal(greeting, 'Hello');
        storage.remove();
        assert.ok(!storage.exists);
    });
});
