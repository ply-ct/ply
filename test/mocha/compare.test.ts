import * as assert from 'assert';
import { Logger, LogLevel, LogOptions } from '../../src/logger';
import { Storage } from '../../src/storage';
import { Compare } from '../../src/compare';

describe('Compare', () => {

    it('handles regex', () => {

        let logger = new Logger({
            ...new LogOptions(),
            level: LogLevel.debug
        }, new Storage('temp/output.log'));

        const compare = new Compare(logger);

        const expected = 'before\n' +
          'headers:\n' +
          '  content-type: application/json${~.*}\n' +
          'after\n';

        const actual = 'before\n' +
        'headers:\n' +
        '  content-type: application/json; charset=utf-8\n' +
        'after\n';

        const diffs = compare.diffLines(expected, actual, {});

        assert.equal(diffs[1].ignored, true);
        assert.equal(diffs[2].ignored, true);
    });

    it('handles multiline regex', () => {

        let logger = new Logger({
            ...new LogOptions(),
            level: LogLevel.debug
        }, new Storage('temp/output.log'));

        const compare = new Compare(logger);

        const expected = 'before\n' +
          'headers:\n' +
          '  content-type: application/json${~.*}\n' +
          '  location: \'${baseUrl}/${id}\'\n';
          'after\n';

        const actual = 'before\n' +
        'headers:\n' +
        '  content-type: application/json; charset=utf-8\n' +
        '  location: \'http://localhost:3000/movies/435b30ad\'\n';
        'after\n';

        const values = {
            baseUrl: 'http://localhost:3000/movies',
            id: '435b30ad'
        };

        const diffs = compare.diffLines(expected, actual, values);

        assert.equal(diffs[1].count, 2);
        assert.equal(diffs[1].removed, true);
        assert.equal(diffs[1].ignored, true);
        assert.equal(diffs[2].count, 2);
        assert.equal(diffs[2].added, true);
        assert.equal(diffs[2].ignored, true);
    });
});
