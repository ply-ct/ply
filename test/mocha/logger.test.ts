import * as assert from 'assert';
import { Logger } from '../../src/logger';
import { Storage } from '../../src/storage';

describe('Logger', function () {

    it('should append output', function () {
        let options = { location: 'temp', name: 'output.log' };
        let logger1 = new Logger(Object.assign({}, options, { retain: false }));
        logger1.info('info message');
        let logger2 = new Logger(options);
        let err = new Error('something bad happened');
        logger2.error('error message', err);
        logger2.debug('should not appear');
        let storage = new Storage('temp', 'output.log');
        let log = storage.read() || '';
        assert.equal(log, `info message\nerror message\n${err.stack}\n`);
        storage.remove();
    });
});
