import * as assert from 'assert';
import { Logger, LogOptions } from '../../src/logger';
import { Storage } from '../../src/storage';

describe('Logger', () => {

    it('should append output', () => {
        const options = new LogOptions();
        const storage = new Storage('temp/output.log');
        const logger1 = new Logger(options, storage);
        logger1.info('info message');
        const logger2 = new Logger(options, storage, true);
        const err = new Error('something bad happened');
        logger2.error('error message', err);
        logger2.debug('should not appear');
        const log = storage.read() || '';
        assert.equal(log, `info message\nerror message\n${err.stack}\n`);
        storage.remove();
    });
});
