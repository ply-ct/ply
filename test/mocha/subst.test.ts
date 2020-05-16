import * as assert from 'assert';
import { Logger, LogLevel, LogOptions } from '../../src/logger';
import { Storage } from '../../src/storage';
import * as subst from '../../src/subst';

describe('subst', () => {

    it('ignores unmatched expressions', async () => {

        let logger = new Logger({
            ...new LogOptions(),
            level: LogLevel.debug
        }, new Storage('temp/output.log'));

        const values = {
            x: 'foo',
            y: 'bar'
        };

        const template = 'here is z: ${x.something()}';

        const res = subst.replace(template, values, logger);
        console.log("RES: " + res);
    });
});
