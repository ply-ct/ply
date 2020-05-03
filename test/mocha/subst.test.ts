import * as assert from 'assert';
import { Logger, LogLevel } from '../../src/logger';
import * as subst from '../../src/subst';

describe('subst', () => {

    it('ignores unmatched expressions', async () => {

        let logger = new Logger({ location: 'temp', name: 'output.log', level: LogLevel.debug });

        const values = {
            x: 'foo',
            y: 'bar'
        };

        const template = 'here is z: ${x.something()}';

        const res = subst.replace(template, values, logger);
        console.log("RES: " + res);
    });
});
