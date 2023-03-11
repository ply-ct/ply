import * as assert from 'assert';
import { Logger } from '../../src/logger';
import { Storage } from '../../src/storage';
import * as util from '../../src/util';

describe('Logger', () => {
    it('should append output', () => {
        const storage = new Storage('temp/output.log');
        const logger1 = new Logger(undefined, storage);
        logger1.info('info message');
        const logger2 = new Logger(undefined, storage, true);
        const err = new Error('something bad happened');
        logger2.error('error message', err);
        logger2.debug('should not appear');
        const log = util.newlines(storage.read() || '');
        assert.strictEqual(log, `info message\nerror message\n${err.stack}\n`);
        storage.remove();
    });
});
