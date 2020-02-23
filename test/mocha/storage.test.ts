import * as assert from 'assert';
import { Storage } from '../../src/storage';

describe('Storage', function () {

    it('should build path', function() {
        let storage = new Storage('temp', 'greeting.txt');
        assert.equal(storage.toString(), 'temp/greeting.txt');
    });

    it('should write and read', async function() {
        let storage = new Storage('temp', 'greeting.txt');
        storage.write('Hello');
        assert.ok(storage.exists);
        let greeting = storage.read();
        assert.equal(greeting, 'Hello');
        storage.remove();
        assert.ok(!storage.exists);
    });
});
