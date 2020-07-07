import * as assert from 'assert';
import { Logger, LogLevel, LogOptions } from '../../src/logger';
import { Storage } from '../../src/storage';
import * as subst from '../../src/subst';

const logger = new Logger({
    ...new LogOptions(),
    level: LogLevel.info
}, new Storage('temp/output.log'));

describe('subst', () => {

    it('ignores unmatched expression lines', () => {

        const values = {
            x: 'foo',
            y: 'bar'
        };

        // note windows newline converted to \n
        const template = 'here is z: ${x.something()},\r\nand here is y: ${y}';
        const res = subst.replace(template, values, logger);
        assert.equal(res, 'here is z: ${x.something()},\nand here is y: bar');
    });
});
