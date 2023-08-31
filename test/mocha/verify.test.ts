import * as assert from 'assert';
import { Log, LogLevel } from '../../src/log';
import { Logger } from '../../src/logger';
import { Config } from '../../src/options';
import { Verifier } from '../../src/result';

describe('Verify', () => {
    const logger: Log = new Logger({ level: LogLevel.debug, prettyIndent: 2 });
    const options = new Config().options;

    it('should identify adjoining ignored diffs', () => {
        const expected =
            'Request One:\n' +
            '  id: s1\n' +
            '  data: | \n' +
            '    {\n' +
            '      "username": "${username}"\n' +
            '      "employeeId": "${employeeId}"\n' +
            '      "status": "Worker"\n' +
            '    }\n';

        const actual =
            'Request One:\n' +
            '  id: s1\n' +
            '  data: | \n' +
            '    {\n' +
            '      "username": "don"\n' +
            '      "employeeId": "001"\n' +
            '      "status": "Slacker"\n' +
            '    }\n';

        const verifier = new Verifier('Result One', { start: 3, text: expected }, logger);
        const outcome = verifier.verify(
            { start: 3, text: actual },
            { username: 'don', employeeId: '001' }
        );

        // TODO fix this
        // assert.strictEqual(outcome.line, 7);
    });
});
